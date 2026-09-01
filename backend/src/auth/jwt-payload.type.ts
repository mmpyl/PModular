import { OrgRole, PlatformRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  organizationId?: string;
  orgRole?: OrgRole;
  platformRole?: PlatformRole;
};

export type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  organizationId?: string;
  orgRole?: OrgRole;
  platformRole?: PlatformRole;
};
