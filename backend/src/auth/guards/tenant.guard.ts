import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Obtener token JWT
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // El JWT DEBE tener organizationId para acceder a recursos tenant-specific
      if (!payload.organizationId) {
        throw new ForbiddenException('Organization context required. Please select an organization first.');
      }

      // FASE 4: Verificación inmediata de suspensión de organización
      // A diferencia de orgRole (que vive en el JWT y puede tardar hasta 1h en refrescarse),
      // una suspensión debe surtir efecto de inmediato — no podemos esperar a que expire el token
      const organization = await this.prisma.organization.findUnique({
        where: { id: payload.organizationId },
        select: { status: true },
      });

      if (!organization) {
        throw new ForbiddenException('Organización no encontrada');
      }

      if (organization.status === 'SUSPENDED') {
        throw new ForbiddenException('Esta organización ha sido suspendida. Contacta al administrador de la plataforma.');
      }

      // Si viene header X-Org-Id, debe coincidir con el del JWT
      const orgIdFromHeader = request.headers['x-org-id'] as string | undefined;
      if (orgIdFromHeader && orgIdFromHeader !== payload.organizationId) {
        throw new ForbiddenException('X-Org-Id header does not match the organization in your token');
      }

      // Establecer organizationId en el request para uso posterior
      request.headers['x-org-id'] = payload.organizationId;
      (request as any).organizationId = payload.organizationId;
      (request as any).orgRole = payload.orgRole;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
