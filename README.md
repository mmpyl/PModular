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
│       │   ├── decorators/     # Decoradores como @Roles()
│       │   ├── dto/            # Contratos de entrada
│       │   ├── guards/         # JwtAuthGuard y RolesGuard
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
