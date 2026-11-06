/**
 * Fase 3 - tarea 3.2/3.3: hooks de organización.
 *
 * useOrg(): acceso tipado a la organización activa (id, rol, membresía,
 * enabledModules) sin repetir `organizationId ?? undefined` en cada página.
 * useMoney(): config de formato (currency/locale/timezone) de la org +
 * helpers listos para usar en componentes.
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Membership } from '@/lib/api';
import { formatMoney, formatDate, formatDateTime, type MoneyConfig } from '@/lib/format';

export type OrgSettings = MoneyConfig & Record<string, unknown>;

export type UseOrgResult = {
  organizationId: string | undefined;
  orgRole: string | null;
  membership: Membership | null;
  enabledModules: string[];
  organizationName: string | null;
  settings: OrgSettings;
  isAuthenticatedOrg: boolean;
};

export function useOrg(): UseOrgResult {
  const { organizationId, orgRole, memberships } = useAuth();
  return useMemo(() => {
    const membership = memberships.find((m) => m.organizationId === organizationId) ?? null;
    const configured = membership?.organization?.enabledModules;
    const defaults = membership?.organization?.businessType?.defaultModules;
    const modules = Array.isArray(configured) && configured.length ? configured : defaults;
    const enabledModules = Array.isArray(modules)
      ? modules.filter((m): m is string => typeof m === 'string')
      : [];
    const rawSettings = (membership?.organization as { settings?: OrgSettings } | undefined)?.settings;
    return {
      organizationId: organizationId ?? undefined,
      orgRole,
      membership,
      enabledModules,
      organizationName: membership?.organization?.name ?? null,
      settings: rawSettings ?? {},
      isAuthenticatedOrg: !!organizationId,
    };
  }, [organizationId, orgRole, memberships]);
}

export type UseMoneyResult = MoneyConfig & {
  money: (amount: number | string | null | undefined) => string;
  date: (date: Date | string | number | null | undefined) => string;
  dateTime: (date: Date | string | number | null | undefined) => string;
};

/**
 * Lee currency y timezone de la configuración de la organización activa.
 * Si la org no define moneda, cae en los defaults de lib/format (PEN / es-PE).
 */
export function useMoney(): UseMoneyResult {
  const { settings } = useOrg();
  return useMemo(() => {
    const config: MoneyConfig = {
      locale: (settings.locale as string) || undefined,
      currency: (settings.currency as string) || undefined,
      timezone: (settings.timezone as string) || undefined,
    };
    return {
      ...config,
      money: (amount) => formatMoney(amount, config),
      date: (date) => formatDate(date, config),
      dateTime: (date) => formatDateTime(date, config),
    };
  }, [settings]);
}
