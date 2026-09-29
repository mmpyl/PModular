# Fase 1 — Contención de seguridad: checklist de rotación de credenciales

> **Regla de oro:** ROTAR PRIMERO, LIMPIAR HISTORIAL DESPUÉS.
> Mientras la credencial vieja siga viva, borrar el archivo del historial de git no reduce el riesgo:
> cualquiera que ya clonó/forkueó el repo (`mmpyl/...`, PRs #1..#110) conserva una copia funcional.

## A. Credenciales confirmadas en `backend/.env` (trackeado en git)

Verificado en el índice de git al 2026-09-29. **No se copiaron los valores a este documento.**

| # | Secreto | Estado | Acción requerida (humano) | Responsable | Hecho |
|---|---------|--------|---------------------------|-------------|-------|
| 1 | `DATABASE_URL` (connection string Postgres/Prisma, incluye usuario+password y probablemente host público) | COMPROMETIDO | 1) Crear nuevo role/password en la DB (o rotar credencial del proveedor gestionado). 2) Revocar/limitar ACL del usuario viejo o eliminarlo. 3) Verificar si hay datos sensibles/multi-tenant expuestos → evaluar notificación. | Admin de infra/DB | ☐ |
| 2 | `JWT_SECRET` (firma de tokens de sesión) | COMPROMETIDO | 1) Generar secreto nuevo (≥256 bits, p. ej. `openssl rand -hex 32`). 2) Desplegar backend con el nuevo valor → **invalida TODOS los tokens existentes** (todos los usuarios deben re-loguearse; planificar ventana/comunicación). 3) Si hay refresh tokens persistidos en DB, considerar revocarlos también. | Backend deploy | ☐ |
| 3 | `TEST_USER_PASSWORD` | COMPROMETIDO | Cambiar password del usuario de test en la base (y actualizar seed/scripts que lo referencien: `backend/scripts/create-test-user.*`, `grant-platform-admin.*`). | Backend/DB | ☐ |
| 4 | `PORT`, `CORS_ORIGIN` | No son secretos | Ninguna. Solo asegurar que `.env.example` siga reflejando defaults seguros. | — | ☐ |

### Búsqueda de otros proveedores (SUNAT/PSE/etc.)
- **Resultado del escaneo:** grep sobre `backend/.env` y `frontend/.env.example` por `sunat|pse|odoo|api_key|secret` → **sin coincidencias además de JWT_SECRET**. En el estado actual del repo NO hay credenciales de proveedor SUNAT/PSE trackeadas.
- ⚠️ El historial real está en GitHub (PRs hasta #110), no en este workspace (ver sección "Limitación"). Repetir la búsqueda sobre el historial COMPLETO antes de cerrar la fase:
  ```bash
  git log --all -p -S"sunat" -i -- '*.env*' | head        # mismo para 'pse', 'api_key', etc.
  # o con herramienta dedicada:
  gitleaks detect --source . --log-opts="--all" --redact
  trufflehog filesystem --only-verified .
  ```
- Si en algún commit pasado aparecieron credenciales SUNAT/PSE/Odoo: rotarlas con el proveedor correspondiente (certificado/huella digital SUNAT, API keys PSE/Odoo) y documentarlo aquí.

## B. Orden correcto de operaciones (secuencia recomendada)

1. ☐ Rotar las 3 credenciales de la tabla A y desplegar los nuevos valores vía variables de entorno del entorno de ejecución (no vía git).
2. ☐ Confirmar que la credencial vieja dejó de funcionar (intentar login/token/connection con el valor antiguo → debe fallar).
3. ☐ Recién entonces aplicar el parche de contención (`.gitignore` + `git rm --cached`) — patch separado en este repo / rama.
4. ☐ Decidir conscientemente sobre reescritura de historial (ver C).
5. ☐ Push forzado del historial limpio + anunciar a colaboradores ("re-cloneen, no hagan pull").

## C. Reescritura de historial — decisión pendiente (NO ejecutada automáticamente)

Opciones:
- **`git filter-repo`** (recomendado si se reescribe):
  ```bash
  pip install git-filter-repo
  git filter-repo --path backend/.env --invert-paths
  # opcional, mismo pase: --path backend/dist/ --path frontend/.next/ --path node_modules/
  ```
- **BFG Repo-Cleaner**: más rápido en repos grandes, requiere `git gc` posterior.
- **Alternativa menos invasiva**: dejar el historial intacto y tratar los secretos como "rotados = muertos". Aceptable SOLO si la rotación (paso B.1) está verificada.

Costos a considerar: cambia todos los SHAs posteriores, rompe forks/clones/PRs abiertos, requiere force-push y coordinación. GitHub retiene cachés del objeto eliminado un tiempo (pedir soporte para purga si el repo fue público).

## D. Limitaciones de verificación en este workspace (importante)

- Este checkout es **shallow/grafted con UN solo commit visible** (`git rev-parse --is-shallow-repository` → `true`; único commit: merge PR #110). Por lo tanto:
  - ✅ Se puede afirmar: `backend/.env` está trackeado AHORA en HEAD, con los 3 secretos activos listados arriba.
  - ❌ NO se puede enumerar desde aquí en cuántos commits históricos aparece el archivo ni qué otros secretos hubo en el pasado → hacerlo contra el clone completo del remoto real antes de ejecutar C.
- El workspace no tiene `remote` configurado; el push/force-push debe hacerse desde el clone real (`mmpyl/...`).

## E. Verificación post-parche (automatizable)

```bash
git ls-files backend/.env backend/dist frontend/.next node_modules   # debe imprimir NADA
git check-ignore -v backend/.env backend/dist/x.js frontend/.next/y node_modules/z  # debe matchear reglas
gitleaks detect .   # gate anti-regresión (agregar al CI)
```
