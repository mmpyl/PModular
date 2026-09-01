import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador que extrae el organizationId verificado del request.
 * 
 * IMPORTANTE: Este decorador solo funciona cuando TenantGuard ha sido ejecutado previamente,
 * ya que lee el organizationId que el guard validó contra el JWT firmado.
 * 
 * Esto previene que el cliente envíe un organizationId arbitrario para acceder
 * a datos de otras organizaciones.
 * 
 * @example
 * @Get()
 * findAll(@CurrentOrg() organizationId: string) {
 *   return this.service.findAll(organizationId);
 * }
 */
export const CurrentOrg = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // El organizationId fue establecido por TenantGuard después de validar el JWT
    const organizationId = request.organizationId || request.headers['x-org-id'];
    
    if (!organizationId) {
      throw new Error(
        'CurrentOrg decorator requires TenantGuard to be executed first. ' +
        'Make sure @UseGuards(TenantGuard) is applied to the controller or route.'
      );
    }
    
    return organizationId;
  },
);
