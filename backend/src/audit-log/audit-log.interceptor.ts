import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from './audit-log.service';
import { AuditActionType, PlatformRole } from '@prisma/client';
import { Request } from 'express';

/**
 * Decorador para marcar endpoints que deben ser auditados automáticamente
 */
export const AUDIT_ACTION = 'audit_action';
export const AUDIT_ENTITY_TYPE = 'audit_entity_type';
export const AUDIT_EXTRACT_ID_FROM_BODY = 'audit_extract_id_from_body';

export function AuditAction(action: AuditActionType) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(AUDIT_ACTION, action, target, propertyKey);
  };
}

export function AuditEntityType(entityType: string) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(AUDIT_ENTITY_TYPE, entityType, target, propertyKey);
  };
}

export function AuditExtractIdFromBody(fieldName: string = 'id') {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(AUDIT_EXTRACT_ID_FROM_BODY, fieldName, target, propertyKey);
  };
}

/**
 * Interceptor que registra automáticamente acciones sensibles en el audit log
 * Se activa cuando los decoradores @AuditAction y @AuditEntityType están presentes
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction = this.reflector.get<AuditActionType>(
      AUDIT_ACTION,
      context.getHandler(),
    );
    const entityType = this.reflector.get<string>(
      AUDIT_ENTITY_TYPE,
      context.getHandler(),
    );

    // Si no hay decoradores de auditoría, no hacer nada
    if (!auditAction || !entityType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const extractIdField = this.reflector.get<string>(
      AUDIT_EXTRACT_ID_FROM_BODY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap({
        next: async (response) => {
          try {
            // Extraer información del contexto
            const user = request['user'] as any;
            const userId = user?.sub || user?.id;
            const userPlatformRole = user?.platformRole as PlatformRole | undefined;
            const organizationId = (request as any).organizationId;

            // Determinar el entityId
            let entityId: string;
            
            // Si hay un campo específico en el body para extraer el ID
            if (extractIdField && request.body?.[extractIdField]) {
              entityId = request.body[extractIdField];
            }
            // Si la respuesta contiene el ID (para creaciones)
            else if (response?.id) {
              entityId = response.id;
            }
            // Si viene en los parámetros de la URL
            else if (request.params?.id) {
              entityId = request.params.id;
            }
            // Fallback: intentar obtener del body directamente
            else if (request.body?.id) {
              entityId = request.body.id;
            }
            else {
              this.logger.warn(`No se pudo determinar entityId para ${auditAction}`);
              return;
            }

            // Construir metadata base
            const metadata: Record<string, any> = {
              method: request.method,
              path: request.url,
              timestamp: new Date().toISOString(),
            };

            // Agregar campos relevantes del body (excluyendo datos sensibles)
            if (request.body) {
              const safeBody = { ...request.body };
              // Eliminar campos sensibles
              delete safeBody.password;
              delete safeBody.currentPassword;
              metadata.requestBody = safeBody;
            }

            // Registrar en audit log
            await this.auditLogService.create({
              userId,
              userPlatformRole,
              action: auditAction,
              entityType,
              entityId,
              organizationId,
              metadata,
            });

            this.logger.debug(
              `Audit logged: ${auditAction} on ${entityType}(${entityId}) by user ${userId}`,
            );
          } catch (err) {
            // No bloquear la respuesta si falla el audit log
            const error = err as Error;
            this.logger.error(`Failed to log audit: ${error.message}`, error.stack);
          }
        },
      }),
    );
  }
}
