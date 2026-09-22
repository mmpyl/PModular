import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NotificationsService, NotificationItem } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface UserWithOrg {
  sub: string;
  email: string;
  organizationId?: string;
  organizationName?: string;
  role?: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, OrgRolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Obtiene notificaciones para la organización del usuario autenticado
   * Query params:
   * - limit: Número máximo de notificaciones a retornar (default: 20)
   */
  @Get()
  async getNotifications(
    @CurrentUser() user: UserWithOrg,
    @Query('limit') limit?: number,
  ): Promise<NotificationItem[]> {
    if (!user.organizationId) {
      return [];
    }

    return this.notificationsService.getOrganizationNotifications(
      user.organizationId,
      limit ? parseInt(limit.toString(), 10) : 20,
    );
  }

  /**
   * GET /notifications/counts
   * Obtiene el conteo de notificaciones no leídas por tipo
   */
  @Get('counts')
  async getNotificationCounts(@CurrentUser() user: UserWithOrg): Promise<Record<string, number>> {
    if (!user.organizationId) {
      return {};
    }

    return this.notificationsService.getNotificationCounts(user.organizationId);
  }
}
