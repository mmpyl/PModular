"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { moduleCatalogSchema, type ModuleCatalogItem } from "./schema";

/** Fetches the backend-owned module catalog used by organization settings. */
export function useModuleCatalog(enabled = true) {
  return useQuery<ModuleCatalogItem[]>({
    queryKey: queryKeys.modules.catalog(),
    queryFn: async () =>
      moduleCatalogSchema.parse(await apiFetch<unknown>("/module-catalog")),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
