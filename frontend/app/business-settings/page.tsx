"use client";

import { FormEvent, useEffect, useState } from "react";
import { OwnerHeader, OwnerShell } from "@/components/OwnerShell";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { useModuleCatalog } from "@/features/modules/hooks";
import { enabledModulesSchema } from "@/features/modules/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Organization = {
  id: string;
  name: string;
  enabledModules: unknown;
  settings: Record<string, unknown>;
  businessType: {
    id: string;
    name: string;
    code: string;
    defaultModules: unknown;
  };
};

const currencies = [
  { code: "PEN", name: "Sol Peruano" },
  { code: "USD", name: "Dólar Estadounidense" },
  { code: "EUR", name: "Euro" },
];
const timezones = [
  { value: "America/Lima", label: "Perú (PET)" },
  { value: "America/Bogota", label: "Colombia (COT)" },
  { value: "America/Mexico_City", label: "México (CST)" },
  { value: "UTC", label: "UTC" },
];
const taxRates = [
  { value: 0.18, label: "18% (IGV - Perú)" },
  { value: 0.19, label: "19% (IVA - Colombia)" },
  { value: 0.16, label: "16% (IVA - México)" },
  { value: 0, label: "0% (Sin impuesto)" },
];

export default function BusinessSettingsPage() {
  const { token, organizationId, refreshMemberships } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [modules, setModules] = useState<string[]>([]);
  const [currency, setCurrency] = useState("PEN");
  const [timezone, setTimezone] = useState("America/Lima");
  const [defaultTaxRate, setDefaultTaxRate] = useState(0.18);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const moduleCatalog = useModuleCatalog(Boolean(token));

  useEffect(() => {
    if (!token || !organizationId) return;
    void apiFetch<Organization>(`/organizations/${organizationId}`, {
      token,
      organizationId,
    })
      .then((result) => {
        setOrganization(result);
        setName(result.name);
        setModules(
          Array.isArray(result.enabledModules)
            ? result.enabledModules.filter(
                (item): item is string => typeof item === "string",
              )
            : [],
        );
        setCurrency((result.settings.currency as string) || "PEN");
        setTimezone((result.settings.timezone as string) || "America/Lima");
        setDefaultTaxRate((result.settings.defaultTaxRate as number) ?? 0.18);
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof ApiError
            ? cause.message
            : "No se pudo cargar la configuración",
        ),
      );
  }, [organizationId, token]);

  function toggleModule(module: string) {
    setModules((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module],
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    try {
      const enabledModules = enabledModulesSchema.parse(modules);
      const updated = await apiFetch<Organization>(
        `/organizations/${organizationId}`,
        {
          method: "PATCH",
          token,
          organizationId,
          body: JSON.stringify({
            name,
            enabledModules,
            settings: { currency, timezone, defaultTaxRate },
          }),
        },
      );
      setOrganization(updated);
      void refreshMemberships();
      setMessage("Configuración guardada");
      setError("");
    } catch (cause: unknown) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Revisa los módulos seleccionados e inténtalo nuevamente",
      );
    }
  }

  return (
    <OwnerShell active="settings">
      <OwnerHeader eyebrow="Administración" title="Configuración del negocio" />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {message}
          </AlertDescription>
        </Alert>
      )}
      {organization && (
        <Card className="mt-4">
          <CardHeader>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Identidad
              </p>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">
                {organization.businessType.name}
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="business-name">Nombre comercial</Label>
                <Input
                  id="business-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-medium">Módulos habilitados</p>
                {moduleCatalog.isLoading && (
                  <p className="text-sm text-muted-foreground">
                    Cargando catálogo de módulos…
                  </p>
                )}
                {moduleCatalog.isError && (
                  <p className="text-sm text-destructive">
                    No se pudo cargar el catálogo de módulos.
                  </p>
                )}
                <div className="grid gap-3">
                  {moduleCatalog.data?.map((module) => (
                    <div
                      key={module.key}
                      className="flex items-start space-x-2"
                    >
                      <Checkbox
                        id={module.key}
                        checked={modules.includes(module.key)}
                        onCheckedChange={() => toggleModule(module.key)}
                      />
                      <div>
                        <Label htmlFor={module.key} className="font-normal">
                          {module.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name} ({item.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Selecciona una zona horaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Impuesto por defecto</Label>
                  <Select
                    value={String(defaultTaxRate)}
                    onValueChange={(value) => setDefaultTaxRate(Number(value))}
                  >
                    <SelectTrigger id="taxRate">
                      <SelectValue placeholder="Selecciona un impuesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRates.map((item) => (
                        <SelectItem key={item.value} value={String(item.value)}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={moduleCatalog.isLoading || moduleCatalog.isError}
              >
                Guardar configuración
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </OwnerShell>
  );
}
