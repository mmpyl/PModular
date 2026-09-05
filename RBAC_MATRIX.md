# Matriz de Permisos por Rol - Sistema PYMEN

## Resumen de Cambios Fase 3 - Seguridad RBAC

### 🔴 BUG CRÍTICO CORREGIDO
**Reportes sin control de roles** - Todos los endpoints de reportes ahora tienen protección `@OrgRoles()`.

---

## Matriz de Permisos Detallada

### 📊 REPORTES (`/reports`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| GET /sales/summary | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /sales/by-category | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /sales/top-products | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /inventory/summary | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /inventory/by-category | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /stock-movements/summary | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /purchases/summary | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /purchases/by-supplier | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /cash-register/summary | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /dashboard/metrics | ✅ | ✅ | ❌ | ✅ | ❌ |
| GET /inventory/expiring-batches | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /inventory/low-stock | ✅ | ✅ | ✅ | ❌ | ❌ |

### 🛒 VENTAS (`/sales`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| POST / (crear) | ✅ | ✅ | ❌ | ✅ | ❌ |
| GET / (listar) | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| PATCH /:id | ✅ | ✅ | ❌ | ✅ | ❌ |
| POST /:id/complete | ✅ | ✅ | ❌ | ✅ | ❌ |
| POST /:id/payment | ✅ | ✅ | ❌ | ✅ | ❌ |
| POST /:id/cancel | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE /:id | ✅ | ✅ | ❌ | ❌ | ❌ |

### 📦 ÓRDENES DE COMPRA (`/purchase-orders`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| POST / (crear) | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET / (listar) | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| PATCH /:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /:id/receive | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /:id/cancel | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /:id | ✅ | ✅ | ❌ | ❌ | ❌ |

### 🏷️ PRODUCTOS (`/products`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| POST / (crear) | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET / (listar) | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE /:id | ✅ | ✅ | ❌ | ❌ | ❌ |

### 📑 CATEGORÍAS (`/categories`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| POST / (crear) | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET / (listar) | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE /:id | ✅ | ✅ | ❌ | ❌ | ❌ |

### 📏 UNIDADES DE MEDIDA (`/units-of-measure`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| POST / (crear) | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET / (listar) | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE /:id | ✅ | ✅ | ❌ | ❌ | ❌ |

### 📦 INVENTARIO (`/inventory`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| GET / (listar) | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| PATCH /:id (actualizar) | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /recalculate/:productId | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /alerts/low-stock | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /alerts/expiring | ✅ | ✅ | ✅ | ❌ | ❌ |

### 💰 CAJA REGISTRADORA (`/cash-registers`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| POST / (crear) | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET / (listar) | ✅ | ✅ | ❌ | ✅ | ❌ |
| GET /:id | ✅ | ✅ | ❌ | ✅ | ❌ |
| GET /:id/movements | ✅ | ✅ | ❌ | ✅ | ❌ |
| PATCH /:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /:id/open | ✅ | ✅ | ❌ | ✅ | ❌ |
| POST /:id/close | ✅ | ✅ | ❌ | ✅ | ❌ |
| POST /:id/movements | ✅ | ✅ | ❌ | ✅ | ❌ |
| DELETE /:id | ✅ | ✅ | ❌ | ❌ | ❌ |

### 👥 MEMBRESÍAS (`/memberships`)
| Endpoint | OWNER | ADMIN | INVENTARIO | VENDEDOR | CAJA |
|----------|-------|-------|------------|----------|------|
| POST / (invitar miembro) | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /user/:userId | ✅* | ✅* | ✅* | ✅* | ✅* |
| GET /organization/:orgId | ✅* | ✅* | ✅* | ✅* | ✅* |
| GET /:userId/:orgId | ✅* | ✅* | ✅* | ✅* | ✅* |
| DELETE /:userId/:orgId | ✅ | ❌ | ❌ | ❌ | ❌ |

*Validación adicional: solo puede ver miembros de su propia organización

---

## Archivos Modificados

1. **`/backend/src/reports/reports.controller.ts`**
   - Agregado: `JwtAuthGuard`, `OrgRolesGuard`, decorador `@OrgRoles()` en todos los endpoints
   - Reportes de ventas: Solo OWNER/ADMIN
   - Reportes de inventario/compras: OWNER/ADMIN/INVENTARIO
   - Dashboard metrics: OWNER/ADMIN/VENDEDOR

2. **`/backend/src/purchase-orders/purchase-orders.controller.ts`**
   - Agregado: `OrgRolesGuard`, decorador `@OrgRoles()` en todos los endpoints
   - Crear/Recibir: OWNER/ADMIN/INVENTARIO
   - Ver: OWNER/ADMIN/INVENTARIO/VENDEDOR
   - Eliminar: Solo OWNER/ADMIN

3. **`/backend/src/products/products.controller.ts`**
   - Agregado: `OrgRolesGuard`, decorador `@OrgRoles()` en todos los endpoints
   - Crear: OWNER/ADMIN/INVENTARIO
   - Ver: OWNER/ADMIN/INVENTARIO/VENDEDOR
   - Eliminar: Solo OWNER/ADMIN

4. **`/backend/src/categories/categories.controller.ts`**
   - Agregado: `OrgRolesGuard`, decorador `@OrgRoles()` en todos los endpoints
   - Crear: OWNER/ADMIN/INVENTARIO
   - Ver: OWNER/ADMIN/INVENTARIO/VENDEDOR
   - Eliminar: Solo OWNER/ADMIN

5. **`/backend/src/units-of-measure/units-of-measure.controller.ts`**
   - Agregado: `OrgRolesGuard`, decorador `@OrgRoles()` en todos los endpoints
   - Crear: OWNER/ADMIN/INVENTARIO
   - Ver: OWNER/ADMIN/INVENTARIO/VENDEDOR
   - Eliminar: Solo OWNER/ADMIN

---

## Notas Importantes

### Errores de Compilación Preexistentes
Los siguientes errores NO fueron introducidos por los cambios de seguridad y existían previamente:
- Tipos de Prisma no generados correctamente (requiere ejecutar `npx prisma generate`)
- Problemas de tipos en `stock-movements.service.ts` con null checks
- Problemas de tipos en `purchase-orders.service.ts` con enums
- Specs desactualizados en `auth.service.spec.ts`

### Recomendaciones para Producción

1. **Ejecutar antes de deploy:**
   ```bash
   cd backend
   npx prisma generate
   npm run build
   ```

2. **Corregir errores de tipos restantes** en:
   - `src/stock-movements/stock-movements.service.ts` (null checks)
   - `src/purchase-orders/purchase-orders.service.ts` (enum comparisons)
   - `src/auth/auth.service.spec.ts` (missing platformRole)

3. **Smoke Test Recomendado:**
   - [ ] Crear organización → Invitar miembro → Login con org seleccionada
   - [ ] CRUD productos con rol INVENTARIO (debe poder crear/editar)
   - [ ] CRUD productos con rol VENDEDOR (NO debe poder crear/eliminar)
   - [ ] Venta completa con rol VENDEDOR
   - [ ] Compra completa con rol INVENTARIO
   - [ ] Reporte de ventas con rol VENDEDOR (debe retornar 403 Forbidden)
   - [ ] Reporte de ventas con rol ADMIN (debe funcionar)

---

## Estado de Fase 3

✅ **COMPLETADO:** Hardening de seguridad RBAC en controllers críticos
🔴 **PENDIENTE:** Corrección de errores de tipos TypeScript preexistentes
🔴 **PENDIENTE:** Database setup para tests end-to-end
