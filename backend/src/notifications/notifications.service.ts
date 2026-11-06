import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditActionType } from '@prisma/client';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: Date;
}

export type NotificationType = 
  | 'STOCK_LOW'
  | 'PURCHASE_ORDER_PENDING'
  | 'CASH_REGISTER_NOT_CLOSED'
  | 'BATCH_EXPIRING_SOON'
  | 'OTHER';

interface NotificationRule {
  type: NotificationType;
  action: AuditActionType;
  entityType: string;
  title: string;
  getMessage: (metadata: Record<string, any>) => string;
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Reglas para generar notificaciones basadas en AuditLog
  private readonly notificationRules: NotificationRule[] = [
    {
      type: 'STOCK_LOW',
      action: AuditActionType.INVENTORY_ADJUSTED,
      entityType: 'InventoryItem',
      title: 'Stock bajo detectado',
      getMessage: (metadata) => `El producto ${metadata.productName || 'desconocido'} tiene stock crítico (${metadata.currentQuantity || 0})`,
      severity: 'high',
    },
    {
      type: 'PURCHASE_ORDER_PENDING',
      action: AuditActionType.PURCHASE_ORDER_CREATED,
      entityType: 'PurchaseOrder',
      title: 'Orden de compra pendiente',
      getMessage: (metadata) => `Orden de compra #${metadata.orderNumber || 'N/A'} creada y pendiente de recepción`,
      severity: 'medium',
    },
    {
      type: 'PURCHASE_ORDER_PENDING',
      action: AuditActionType.PURCHASE_ORDER_UPDATED,
      entityType: 'PurchaseOrder',
      title: 'Orden de compra actualizada',
      getMessage: (metadata) => `Orden de compra #${metadata.orderNumber || 'N/A'} actualizada, aún pendiente de recepción`,
      severity: 'medium',
    },
    {
      type: 'CASH_REGISTER_NOT_CLOSED',
      action: AuditActionType.CASH_REGISTER_OPENED,
      entityType: 'CashRegister',
      title: 'Caja abierta sin cerrar',
      getMessage: (metadata) => `Caja "${metadata.cashRegisterName || 'desconocida'}" abierta desde el ${metadata.openedAt ? new Date(metadata.openedAt).toLocaleDateString() : 'día anterior'}`,
      severity: 'high',
    },
    {
      type: 'BATCH_EXPIRING_SOON',
      action: AuditActionType.BATCH_CREATED,
      entityType: 'Batch',
      title: 'Lote próximo a vencer',
      getMessage: (metadata) => `Lote ${metadata.batchNumber || 'N/A'} del producto ${metadata.productName || 'desconocido'} vence el ${metadata.expirationDate ? new Date(metadata.expirationDate).toLocaleDateString() : 'fecha desconocida'}`,
      severity: 'medium',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene notificaciones para una organización específica
   * Combina eventos recientes del AuditLog con estado actual del sistema
   */
  async getOrganizationNotifications(organizationId: string, limit: number = 50): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    try {
      // 1. Obtener eventos recientes del AuditLog para la organización
      const recentLogs = await this.prisma.auditLog.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // 2. Convertir logs relevantes a notificaciones
      for (const log of recentLogs) {
        const rule = this.notificationRules.find(
          (r) => r.action === log.action && r.entityType === log.entityType,
        );

        if (rule) {
          notifications.push({
            id: log.id,
            type: rule.type,
            title: rule.title,
            message: rule.getMessage(log.metadata as Record<string, any>),
            severity: rule.severity,
            isRead: false, // Por defecto no leídas, se podría persistir en otro modelo
            relatedEntityType: log.entityType,
            relatedEntityId: log.entityId,
            createdAt: log.createdAt,
          });
        }
      }

      // 3. Agregar notificaciones de estado actual (cajas abiertas, stock bajo, etc.)
      const currentStateNotifications = await this.getCurrentStateNotifications(organizationId);
      notifications.push(...currentStateNotifications);

      // 4. Ordenar por fecha (más reciente primero) y eliminar duplicados
      const uniqueNotifications = notifications
        .filter((n, index, self) => index === self.findIndex((t) => t.id === n.id))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return uniqueNotifications.slice(0, limit);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to get notifications: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Obtiene notificaciones basadas en el estado actual del sistema
   * (no solo eventos históricos del AuditLog)
   */
  private async getCurrentStateNotifications(organizationId: string): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    try {
      // 1. Verificar cajas abiertas sin cerrar del día anterior o actuales
      const openCashRegisters = await this.prisma.cashRegister.findMany({
        where: {
          organizationId,
          status: 'OPEN',
        },
        orderBy: { openedAt: 'desc' },
      });

      for (const cashRegister of openCashRegisters) {
        const openedAt = cashRegister.openedAt || cashRegister.createdAt;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (openedAt < yesterday) {
          notifications.push({
            id: `cash-register-${cashRegister.id}-not-closed`,
            type: 'CASH_REGISTER_NOT_CLOSED',
            title: 'Caja sin cerrar del día anterior',
            message: `La caja "${cashRegister.name}" está abierta desde ${openedAt.toLocaleDateString()} y no ha sido cerrada`,
            severity: 'high',
            isRead: false,
            relatedEntityType: 'CashRegister',
            relatedEntityId: cashRegister.id,
            createdAt: openedAt,
          });
        }
      }

      // 2. Verificar stock bajo en inventario
      const lowStockItems = await this.prisma.inventoryItem.findMany({
        where: {
          organizationId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              lowStockThreshold: true,
            },
          },
        },
      });

      for (const item of lowStockItems) {
        if (item.quantity.lt(item.product.lowStockThreshold)) {
          notifications.push({
            id: `stock-low-${item.id}`,
            type: 'STOCK_LOW',
            title: 'Stock bajo',
            message: `El producto "${item.product.name}" tiene stock crítico: ${item.quantity.toString()} unidades (umbral: ${item.product.lowStockThreshold.toString()})`,
            severity: 'high',
            isRead: false,
            relatedEntityType: 'InventoryItem',
            relatedEntityId: item.id,
            createdAt: new Date(),
          });
        }
      }

      // 3. Verificar órdenes de compra pendientes de recibir
      const pendingPurchaseOrders = await this.prisma.purchaseOrder.findMany({
        where: {
          organizationId,
          status: {
            in: ['ENVIADA', 'CONFIRMADA', 'PARCIALMENTE_RECIBIDA'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      for (const order of pendingPurchaseOrders) {
        notifications.push({
          id: `purchase-order-${order.id}-pending`,
          type: 'PURCHASE_ORDER_PENDING',
          title: 'Orden de compra pendiente',
          message: `Orden de compra #${order.orderNumber} está pendiente de recepción completa`,
          severity: 'medium',
          isRead: false,
          relatedEntityType: 'PurchaseOrder',
          relatedEntityId: order.id,
          createdAt: order.createdAt,
        });
      }

      // 4. Verificar lotes próximos a vencer (en los próximos 7 días)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringBatches = await this.prisma.batch.findMany({
        where: {
          organizationId,
          status: 'ACTIVO',
          expirationDate: {
            lte: sevenDaysFromNow,
            gte: new Date(),
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { expirationDate: 'asc' },
        take: 10,
      });

      for (const batch of expiringBatches) {
        notifications.push({
          id: `batch-${batch.id}-expiring`,
          type: 'BATCH_EXPIRING_SOON',
          title: 'Lote próximo a vencer',
          message: `El lote "${batch.batchNumber}" del producto "${batch.product.name}" vence el ${batch.expirationDate?.toLocaleDateString()}`,
          severity: 'medium',
          isRead: false,
          relatedEntityType: 'Batch',
          relatedEntityId: batch.id,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to get current state notifications: ${error.message}`, error.stack);
    }

    return notifications;
  }

  /**
   * Obtiene el conteo de notificaciones no leídas por tipo
   */
  async getNotificationCounts(organizationId: string): Promise<Record<NotificationType, number>> {
    const notifications = await this.getOrganizationNotifications(organizationId, 100);
    
    const counts: Record<NotificationType, number> = {
      STOCK_LOW: 0,
      PURCHASE_ORDER_PENDING: 0,
      CASH_REGISTER_NOT_CLOSED: 0,
      BATCH_EXPIRING_SOON: 0,
      OTHER: 0,
    };

    for (const notification of notifications) {
      if (!notification.isRead) {
        counts[notification.type] = (counts[notification.type] || 0) + 1;
      }
    }

    return counts;
  }
}
