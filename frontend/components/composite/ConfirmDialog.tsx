/**
 * Fase 3 - tarea 3.4: confirmaciones imperativas con Radix Dialog.
 *
 * Reemplaza los `confirm()` nativos (que bloquean el hilo, no son accesibles
 * y no siguen el diseño). Uso:
 *
 *   const confirmed = await confirmDialog({
 *     title: 'Cancelar venta',
 *     description: 'Esta acción no se puede deshacer.',
 *     destructive: true,
 *   });
 *   if (!confirmed) return;
 *
 * Requiere <ConfirmDialogHost /> montado una vez en el layout raíz.
 */
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Confirmation = ConfirmOptions & { resolve: (value: boolean) => void };

let requestConfirmation: ((c: Confirmation) => void) | null = null;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!requestConfirmation) {
      // Sin host montado: no bloquear el flujo del usuario
      resolve(window.confirm(`${options.title}\n${options.description ?? ''}`));
      return;
    }
    requestConfirmation({ ...options, resolve });
  });
}

export function ConfirmDialogHost() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    requestConfirmation = (c) => setConfirmation(c);
    return () => {
      requestConfirmation = null;
    };
  }, []);

  const close = (value: boolean) => {
    confirmation?.resolve(value);
    setConfirmation(null);
  };

  return (
    <Dialog.Root open={!!confirmation} onOpenChange={(open) => !open && close(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg"
          aria-describedby={confirmation?.description ? 'confirm-dialog-description' : undefined}
        >
          <Dialog.Title className="text-lg font-semibold">
            {confirmation?.title}
          </Dialog.Title>
          {confirmation?.description && (
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {confirmation.description}
            </Dialog.Description>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => close(false)}>
              {confirmation?.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button
              variant={confirmation?.destructive ? 'destructive' : 'default'}
              autoFocus
              onClick={() => close(true)}
            >
              {confirmation?.confirmLabel ?? 'Confirmar'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
