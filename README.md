# PModular

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-blue?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-blue?logo=postgresql)](https://www.postgresql.org/)

Base modular para aplicaciones enterprise con NestJS, Next.js App Router, PostgreSQL y Prisma.

## 🚀 Inicio rápido

### Ejecución local

Requisitos previos:
- Node.js 20+
- PostgreSQL activo
- Base de datos creada para PModular

1. **Configura variables de entorno:**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. **Instala dependencias:**

```bash
npm install
```

3. **Genera Prisma Client y aplica migraciones:**

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

4. **Construye el proyecto:**

```bash
npm run build
```

5. **Inicia las aplicaciones:**

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

La API queda disponible en `http://localhost:3001` y la aplicación web en `http://localhost:3000`.

> **Nota:** Para producción usa `npm run start:backend` y `npm run start:frontend`.

### Migraciones de base de datos

El historial de Prisma es la fuente de verdad del esquema. **No uses `prisma db push`** en entornos compartidos, staging o producción, porque omite las migraciones versionadas.

1. Modifica `backend/prisma/schema.prisma`.
2. Genera y revisa la migración localmente: `npm run prisma:migrate -w backend -- --name descripcion-del-cambio`.
3. Confirma la nueva carpeta y su `migration.sql` en `backend/prisma/migrations/`.
4. Despliega exclusivamente con `npm run prisma:migrate:deploy`.

La migración `20260921_baseline_unversioned_schema` captura los cambios históricos que llegaron mediante `db push`, incluidos almacenes, transferencias, compras, ventas, cajas, auditoría, `Organization.status` y `Product.lowStockThreshold`. En una base que ya contiene esas estructuras, no ejecutes esta migración otra vez: primero márcala como aplicada con:

```bash
npm exec --workspace backend prisma migrate resolve --applied 20260921_baseline_unversioned_schema
```

Después, `npm run prisma:migrate:deploy` aplicará únicamente las migraciones posteriores. Las bases nuevas deben ejecutar `prisma:migrate:deploy` sin usar `migrate resolve`.

Para comprobar que el schema y el historial siguen sincronizados, crea una base temporal vacía para `SHADOW_DATABASE_URL` y ejecuta:

```bash
SHADOW_DATABASE_URL=postgresql://... npm run prisma:migrations:check -w backend
```

### Variables de entorno

**Backend (`backend/.env`):**
- `DATABASE_URL`: Conexión a PostgreSQL
- `JWT_SECRET`: Secreto para tokens JWT
- `JWT_EXPIRES_IN`: Duración de tokens (ej: "1h")
- `PORT`: Puerto del backend (default: 3001)
- `CORS_ORIGIN`: Orígenes permitidos (separados por coma)

**Frontend (`frontend/.env.local`):**
- `NEXT_PUBLIC_API_URL`: URL de la API backend

---

## 🐳 Ejecución con Docker

### Backend

```bash
docker build -t pmodular-backend ./backend
docker run -p 3001:3001 --env-file backend/.env pmodular-backend
```

### Frontend

```bash
docker build -t pmodular-frontend ./frontend
docker run -p 3000:3000 --env NEXT_PUBLIC_API_URL=http://localhost:3001 pmodular-frontend
```

---

## 📁 Estructura del proyecto

```
PModular/
├── backend/                    # API NestJS
│   ├── prisma/
│   │   └── schema.prisma       # Modelos Prisma
│   ├── scripts/                # Scripts de utilidad
│   └── src/
│       ├── auth/               # Autenticación JWT y RBAC
│       │   ├── decorators/     # @Roles(), @OrgRoles(), @CurrentUser()
│       │   ├── dto/            # Contratos de entrada
│       │   ├── guards/         # JwtAuthGuard, OrgRolesGuard, PlatformRolesGuard, TenantGuard
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   └── jwt.strategy.ts
│       ├── users/              # Gestión de usuarios
│       │   ├── dto/
│       │   ├── repositories/
│       │   └── users.service.ts
│       ├── organizations/      # Multi-tenant
│       ├── platform/           # Configuración de plataforma y administración global
│       ├── audit-log/          # Sistema de auditoría y trazabilidad
│       │   ├── dto/
│       │   ├── audit-log.controller.ts
│       │   ├── audit-log.service.ts
│       │   └── audit-log.interceptor.ts
│       ├── business-entities/  # Entidades de negocio
│       │   ├── dto/
│       │   └── business-entities.service.ts
│       ├── business-types/     # Tipos de negocio
│       ├── categories/         # Categorías
│       ├── products/           # Productos
│       ├── units-of-measure/   # Unidades de medida
│       ├── inventory/          # Inventario
│       ├── stock-movements/    # Movimientos de stock
│       ├── purchase-orders/    # Órdenes de compra
│       │   ├── dto/
│       │   └── purchase-orders.service.ts
│       ├── sales/              # Ventas
│       │   ├── dto/
│       │   ├── repositories/
│       │   └── sales.service.ts
│       ├── cash-registers/     # Cajas registradoras
│       │   ├── dto/
│       │   ├── repositories/
│       │   └── cash-registers.service.ts
│       ├── memberships/        # Membresías
│       ├── batches/            # Lotes
│       ├── reports/            # Reportes
│       │   ├── dto/
│       │   └── reports.service.ts
│       ├── common/             # Utilidades compartidas
│       │   ├── dto/
│       │   ├── filters/        # Filtros de excepciones
│       │   └── interceptors/   # Interceptores HTTP
│       ├── app.module.ts
│       ├── main.ts
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── frontend/                   # Next.js App Router
│   ├── app/
│   │   ├── login/              # Inicio de sesión
│   │   ├── register/           # Registro
│   │   ├── dashboard/          # Panel principal
│   │   ├── create-organization/# Crear organización
│   │   ├── select-organization/# Seleccionar organización
│   │   ├── onboarding/         # Onboarding
│   │   ├── platform/           # Administración plataforma
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── organizations/
│   │   │   ├── audit-log/      # Auditoría del sistema
│   │   │   └── login/
│   │   ├── team/               # Gestión de equipo
│   │   ├── business-settings/  # Configuración negocio
│   │   ├── products/           # Productos
│   │   ├── categories/         # Categorías
│   │   ├── units/              # Unidades de medida
│   │   ├── inventory/          # Inventario
│   │   ├── purchase-orders/    # Órdenes de compra
│   │   ├── sales/              # Ventas
│   │   ├── cash-registers/     # Cajas
│   │   └── reports/            # Reportes
│   ├── components/             # Componentes reutilizables
│   ├── contexts/
│   │   └── AuthContext.tsx     # Estado de autenticación
│   ├── features/               # Características por dominio
│   ├── lib/
│   │   └── api.ts              # Cliente HTTP
│   └── middleware.ts           # Middleware de rutas
├── package.json                # Workspace raíz
└── README.md
```
---

## 📦 Scripts disponibles

Desde la raíz del workspace:

| Comando | Descripción |
|---------|-------------|
| `npm run dev:backend` | Inicia el backend en modo desarrollo |
| `npm run dev:frontend` | Inicia el frontend en modo desarrollo |
| `npm run start:backend` | Inicia el backend en producción |
| `npm run start:frontend` | Inicia el frontend en producción |
| `npm run build` | Construye ambos proyectos |
| `npm run prisma:generate` | Genera Prisma Client |
| `npm run prisma:migrate:deploy` | Aplica migraciones pendientes |
| `npm run test` | Ejecuta tests del backend |

Desde el backend (`-w backend`):

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript |
| `npm run start` | Inicia en producción |
| `npm run start:dev` | Inicia en desarrollo con watch |
| `npm run test` | Tests unitarios |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Tests con cobertura |
| `npm run lint` | Linting con ESLint |
| `npm run format` | Formateo con Prettier |
| `npm run prisma:generate` | Genera Prisma Client |
| `npm run prisma:migrate` | Ejecuta migraciones |

Desde el frontend (`-w frontend`):

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia Next.js en desarrollo |
| `npm run build` | Construye para producción |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Linting con ESLint |

---

## ✨ Características principales

- **🏢 Multi-tenant:** Soporte para organizaciones múltiples con guards dedicados (TenantGuard, OrgRolesGuard)
- **🔐 Autenticación JWT:** Sistema completo con refresh tokens y roles por organización
- **🛡️ RBAC avanzado:** Guards de roles a nivel plataforma y organización con decoradores @OrgRoles() y @PlatformRoles()
- **📝 Auditoría completa:** Sistema de audit-log con interceptor automático para trazabilidad de operaciones
- **🧹 Arquitectura limpia:** Separación de responsabilidades con controladores, servicios y repositorios
- **✅ Validación robusta:** DTOs con class-validator y transformación automática
- **📦 Flexibilidad de datos:** Campos JSON para metadatos personalizables
- **📊 Gestión de inventario:** Control de stock, movimientos y lotes
- **💼 Módulos empresariales:** Productos, categorías, unidades de medida, compras, ventas, cajas y membresías
- **🏛️ Administración de plataforma:** Módulo platform para gestión global de usuarios y organizaciones

---

## 📖 Manual de expansión

Para crear una nueva funcionalidad, por ejemplo `ventas`:

1. **Modelo de datos:** Agrega modelos en `backend/prisma/schema.prisma`. Si necesitas flexibilidad documental, usa campos `Json` como `metadata Json?` o `datosAdicionales Json?`.

2. **Migración:** Ejecuta `npm run prisma:migrate -w backend -- --name add-ventas`.

3. **Módulo backend:** Crea `backend/src/ventas/ventas.module.ts` e impórtalo en `backend/src/app.module.ts`.

4. **DTOs:** Define contratos en `backend/src/ventas/dto` para validar entrada y evitar acoplar la API al modelo Prisma.

5. **Repositorio:** Crea `backend/src/ventas/repositories/ventas.repository.ts` para encapsular consultas Prisma.

6. **Servicio:** Crea `backend/src/ventas/ventas.service.ts` con la lógica de aplicación.

7. **Controlador:** Crea `backend/src/ventas/ventas.controller.ts` con rutas REST. Protege rutas con `JwtAuthGuard`, `OrgRolesGuard` o `PlatformRolesGuard` según corresponda. Usa el decorador `@OrgRoles()` para definir permisos específicos.

8. **Auditoría (opcional):** Si el módulo requiere trazabilidad, importa `AuditLogModule` y usa el interceptor `AuditLogInterceptor` para registrar automáticamente las operaciones.

9. **Frontend:** Crea rutas en `frontend/app/ventas`, componentes en `frontend/components/ventas` y funciones de API en `frontend/lib`.

10. **Pruebas:** Añade tests unitarios para servicios/repositorios y tests de integración para controladores críticos.

11. **Escalabilidad:** Si el módulo crece, separa subdominios y eventos sin romper la interfaz pública del módulo.

---

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para detalles.

---

## 🔗 Recursos adicionales

- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [RBAC Matrix](RBAC_MATRIX.md) - Matriz de roles y permisos
- [Audit Log Interceptor](backend/src/audit-log/audit-log.interceptor.ts) - Implementación del interceptor de auditoría
