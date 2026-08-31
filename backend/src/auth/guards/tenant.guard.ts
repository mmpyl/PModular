import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Intentar obtener organizationId del header X-Org-Id
    const orgIdFromHeader = request.headers['x-org-id'] as string | undefined;
    
    // Obtener token JWT
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return true; // Si no hay auth, dejar que otros guards lo manejen
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // Si el payload ya tiene organizationId, usarlo
      if (payload.organizationId) {
        request.headers['x-org-id'] = payload.organizationId;
        return true;
      }

      // Si viene header X-Org-Id, validarlo contra las membresías del usuario
      if (orgIdFromHeader) {
        // Aquí se podría validar que el usuario pertenece a esa organización
        // Esto se hará en el AuthService al generar el token
        request.headers['x-org-id'] = orgIdFromHeader;
        return true;
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
