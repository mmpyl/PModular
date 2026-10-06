# PModular

Base modular para aplicaciones enterprise con NestJS, Next.js App Router, PostgreSQL y Prisma.

## Ejecución local

La ejecución local requiere PostgreSQL activo y una base de datos creada para PModular. Configura estas variables:

- Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT` y `CORS_ORIGIN`.
- Frontend: `NEXT_PUBLIC_API_URL`.

Desde PowerShell, en la raíz del proyecto:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
```

Inicia cada aplicación en una terminal independiente:

```powershell
# Terminal 1
npm run start:backend

# Terminal 2
npm run start:frontend
```

La API queda disponible en `http://localhost:3001` y la aplicación web en `http://localhost:3000`. Para desarrollo con recarga automática usa `npm run dev:backend` y `npm run dev:frontend`. `CORS_ORIGIN` admite varios orígenes separados por coma.

### Accesos de negocio y plataforma

- Usuarios de negocio inician sesión en `http://localhost:3000/login` y acceden a las organizaciones donde tienen membresía.
- Administradores globales inician sesión en `http://localhost:3000/platform/login` y administran organizaciones y usuarios tenant desde `/platform`.
- Son cuentas separadas: una cuenta `PLATFORM_ADMIN` no puede tener membresías de negocio ni usar el acceso de negocio.
- Para crear una cuenta global separada desde la raíz del proyecto: `npm run create:platform-admin -w backend -- platform.owner@pmodular.local "Owner de plataforma"`. El comando genera una contraseña temporal aleatoria y la muestra una sola vez.
- Para promover una cuenta existente sin membresías: `npm run grant:platform-admin -w backend -- admin@ejemplo.com`. El script rechaza cuentas que ya pertenezcan a negocios.
- Para crear una organización desde la consola global, el correo del owner debe pertenecer a una cuenta de negocio ya registrada.
- El CRUD de usuarios global permite crear, consultar, editar, asignar roles por organización y eliminar cuentas tenant; no lista ni modifica cuentas de plataforma y protege al último `OWNER` de cada organización.
- La emisión Nubefact guarda su token cifrado con `NUBEFACT_ENCRYPTION_KEY`; genera 32 bytes aleatorios en cada ambiente (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) y mantén esa clave fuera del repositorio. Si se pierde, será necesario volver a guardar el token desde Configuración.
- En Configuración del negocio puedes guardar cuentas Yape/Plin (número, titular, código y URL del QR), datos fiscales y series/correlativos de ticket, boleta y factura. El formulario de pago muestra la cuenta/QR y registra cuál recibió el abono.
- Los tickets son comprobantes internos imprimibles. Las boletas y facturas se envían a Nubefact/SUNAT; configura la ruta API y el token por organización en Configuración. La clave local `NUBEFACT_ENCRYPTION_KEY` debe estar en `backend/.env` antes de guardar ese token. Facturas requieren RUC del receptor y la configuración fiscal del emisor; las boletas de S/ 700 o más requieren DNI/RUC.
- Los documentos guardan su serie/correlativo y estado. PDF/XML/CDR aparecen cuando Nubefact los devuelve; un error de red queda en estado incierto y bloquea el reenvío automático para no duplicar la emisión.

Para actualizar el esquema durante desarrollo, crea una migración con `npm run prisma:migrate -w backend`; para aplicar migraciones existentes usa `npm run prisma:migrate:deploy`.

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
