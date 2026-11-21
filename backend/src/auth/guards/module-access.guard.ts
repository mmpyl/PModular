import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { REQUIRED_MODULES_KEY } from '../decorators/required-modules.decorator';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredModules = this.reflector.getAllAndOverride<string[]>(REQUIRED_MODULES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredModules?.length) return true;

    const request = context.switchToHttp().getRequest<{ organizationId?: string }>();
    if (!request.organizationId) throw new ForbiddenException('Organization context required');

    const organization = await this.prisma.organization.findUnique({
      where: { id: request.organizationId },
      select: { enabledModules: true },
    });
    const enabledModules = Array.isArray(organization?.enabledModules)
      ? organization.enabledModules.filter((module): module is string => typeof module === 'string')
      : [];
    if (!requiredModules.some((module) => enabledModules.includes(module))) {
      throw new ForbiddenException(`El módulo requerido no está habilitado para este negocio`);
    }
    return true;
  }
}