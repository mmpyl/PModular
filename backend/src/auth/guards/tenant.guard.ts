import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

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
