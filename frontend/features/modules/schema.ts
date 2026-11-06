import { z } from "zod";

export const moduleCatalogItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
});

export const moduleCatalogSchema = z.array(moduleCatalogItemSchema);

export const enabledModulesSchema = z
  .array(z.string().min(1))
  .refine(
    (modules) => new Set(modules).size === modules.length,
    "No se puede habilitar el mismo módulo más de una vez.",
  );

export type ModuleCatalogItem = z.infer<typeof moduleCatalogItemSchema>;
