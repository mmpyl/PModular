import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * Registra método, ruta, código de estado y latencia de cada request.
 * Útil como base para observabilidad; en producción se puede reemplazar
 * el Logger de Nest por un transporte estructurado (pino, winston, etc.).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsedMs = Date.now() - start;
        this.logger.log(`${method} ${originalUrl} ${response.statusCode} +${elapsedMs}ms`);
      }),
    );
  }
}
