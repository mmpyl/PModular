import { AuditLog, AuditActionType } from '@prisma/client';

export interface AuditLogResponse extends Omit<AuditLog, 'metadata'> {
  metadata: Record<string, any>;
}

export interface PaginatedAuditLogResult {
  data: AuditLogResponse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
