# PymeN Enterprise Full Stack Boilerplate

Base modular para aplicaciones enterprise con NestJS, Next.js App Router, PostgreSQL y Prisma.

## Estructura de carpetas

```text
PymeN/
├── backend/                    # API NestJS
│   ├── prisma/
│   │   └── schema.prisma       # Modelos Prisma y JSONB flexible
│   └── src/
│       ├── auth/               # Registro, login, JWT y autorización
│       │   ├── decorators/     # Decoradores como @Roles(), @CurrentUser()
│       │   ├── dto/            # Contratos de entrada
│       │   ├── guards/         # JwtAuthGuard, RolesGuard, TenantGuard
│       │   ├── auth.controller.ts
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── jwt-payload.type.ts
│       │   └── jwt.strategy.ts
│       ├── users/              # Gestión y persistencia de usuarios
│       │   ├── dto/
│       │   ├── repositories/   # Acceso a datos aislado
│       │   ├── users.module.ts
│       │   └── users.service.ts
│       ├── organizations/      # Gestión de organizaciones multi-tenant
│       ├── business-entities/  # Entidades de negocio
│       │   └── dto/
│       ├── business-types/     # Tipos de negocio
│       ├── categories/         # Categorías de productos
│       ├── products/           # Gestión de productos
│       ├── units-of-measure/   # Unidades de medida
│       ├── inventory/          # Gestión de inventario
│       ├── stock-movements/    # Movimientos de stock
│       ├── purchase-orders/    # Órdenes de compra
│       │   └── dto/
│       ├── sales/              # Ventas y transacciones
│       │   ├── dto/
│       │   └── repositories/
│       ├── cash-registers/     # Cajas registradoras
│       │   ├── dto/
│       │   └── repositories/
│       ├── memberships/        # Membresías y suscripciones
│       ├── batches/            # Gestión de lotes
│       ├── reports/            # Reportes y estadísticas
│       │   └── dto/
│       ├── common/             # Utilidades compartidas
│       │   ├── dto/
│       │   ├── filters/        # Filtros de excepciones
│       │   └── interceptors/   # Interceptores HTTP
│       ├── prisma.module.ts
│       ├── prisma.service.ts
│       ├── app.module.ts
│       └── main.ts
├── frontend/                   # Web Next.js App Router
│   ├── app/
│   │   ├── dashboard/          # Ejemplo de ruta protegida
│   │   ├── login/              # Ejemplo de inicio de sesión
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # Estado global de autenticación
│   ├── components/             # Componentes reutilizables
│   └── lib/
│       └── api.ts              # Cliente HTTP centralizado
└── package.json                # Workspace raíz
```

Los módulos de negocio futuros deben añadirse en `backend/src/<modulo>` y `frontend/app/<modulo>` manteniendo controladores, servicios, DTOs y repositorios separados.

## Inicio rápido

1. Copia variables de entorno:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env.local`
2. Instala dependencias: `npm install`
3. Genera Prisma Client: `npm run prisma:generate -w backend`
4. Ejecuta migraciones: `npm run prisma:migrate -w backend`
5. Levanta backend: `npm run dev:backend`
6. Levanta frontend: `npm run dev:frontend`

## Scripts disponibles

Desde la raíz del workspace:

- `npm run dev:backend` - Inicia el backend en modo desarrollo
- `npm run dev:frontend` - Inicia el frontend en modo desarrollo
- `npm run build` - Construye ambos proyectos
- `npm run test` - Ejecuta tests del backend

Desde el backend (`-w backend`):

- `npm run build` - Compila TypeScript
- `npm run start` - Inicia en producción
- `npm run start:dev` - Inicia en desarrollo con watch
- `npm run test` - Tests unitarios
- `npm run test:watch` - Tests en modo watch
- `npm run test:cov` - Tests con cobertura
- `npm run lint` - Linting con ESLint
- `npm run format` - Formateo con Prettier
- `npm run prisma:generate` - Genera Prisma Client
- `npm run prisma:migrate` - Ejecuta migraciones

## Manual de expansión

Para crear una funcionalidad independiente, por ejemplo `ventas`:

1. **Modelo de datos:** agrega modelos en `backend/prisma/schema.prisma`. Si necesitas flexibilidad documental, usa campos `Json` como `metadata Json?` o `datosAdicionales Json?`.
2. **Migración:** ejecuta `npm run prisma:migrate -w backend -- --name add-ventas`.
3. **Módulo backend:** crea `backend/src/ventas/ventas.module.ts` e impórtalo en `backend/src/app.module.ts`.
4. **DTOs:** define contratos en `backend/src/ventas/dto` para validar entrada y evitar acoplar la API al modelo Prisma.
5. **Repositorio:** crea `backend/src/ventas/repositories/ventas.repository.ts` para encapsular consultas Prisma.
6. **Servicio:** crea `backend/src/ventas/ventas.service.ts` con la lógica de aplicación.
7. **Controlador:** crea `backend/src/ventas/ventas.controller.ts` con rutas REST. Protege rutas con `JwtAuthGuard` y `RolesGuard` cuando aplique.
8. **Frontend:** crea rutas en `frontend/app/ventas`, componentes en `frontend/components/ventas` y funciones de API en `frontend/lib`.
9. **Pruebas:** añade tests unitarios para servicios/repositorios y tests de integración para controladores críticos.
10. **Escalabilidad:** si el módulo crece, separa subdominios y eventos sin romper la interfaz pública del módulo.

## Características principales

- **Multi-tenant:** Soporte para organizaciones múltiples con guards dedicados
- **Autenticación JWT:** Sistema completo con refresh tokens y roles por organización
- **Arquitectura limpia:** Separación de responsabilidades con controladores, servicios y repositorios
- **Validación robusta:** DTOs con class-validator y transformación automática
- **Flexibilidad de datos:** Campos JSON para metadatos personalizables
- **Gestión de inventario:** Control de stock, movimientos y lotes
- **Módulos empresariales:** Productos, categorías, unidades de medida, compras, ventas y cajas
