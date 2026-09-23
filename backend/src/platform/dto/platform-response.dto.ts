import { PlatformRole, OrgRole, AuditActionType } from '@prisma/client';

/**
 * Interfaz para respuesta de organización con detalles completos
 */
export interface PlatformOrganizationResponse {
  id: string;
  name: string;
  businessTypeId: string;
  businessType: {
    id: string;
    name: string;
    code: string;
    defaultModules: any;
  };
  enabledModules: any;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
  members?: Array<{
    id: string;
    userId: string;
    role: OrgRole;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }>;
  _count?: {
    memberships: number;
    products?: number;
  };
}

/**
 * Interfaz para respuesta de usuario de plataforma
 */
export interface PlatformUserResponse {
  id: string;
  email: string;
  name: string | null;
  platformRole: PlatformRole | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    memberships: number;
  };
}

/**
 * Actividad reciente del sistema
 */
export interface RecentActivity {
  id: string;
  action: AuditActionType;
  entityType: string;
  entityId: string;
  timestamp: Date;
  userName: string;
  organizationName: string | null;
}

/**
 * Métricas agregadas de la plataforma
 */
export interface PlatformMetricsResponse {
  organizations: {
    total: number;
    active: number;
    suspended: number;
    newLast7Days: number;
    newLast30Days: number;
  };
  users: {
    total: number;
  };
  recentActivity: RecentActivity[];
}

/**
 * Tipo genérico para respuestas paginadas en platform
 */
export type PaginatedPlatformResult<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
