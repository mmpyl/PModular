# Continuous Integration (CI)

Este proyecto utiliza GitHub Actions para ejecutar automáticamente build y lint en cada Pull Request, tanto para backend como para frontend.

## Workflows Disponibles

### Backend CI (`.github/workflows/backend-ci.yml`)
- Se ejecuta en cada PR que modifique archivos en `backend/` o el workflow mismo
- Se ejecuta en push a `main` que modifique archivos en `backend/`
- Ejecuta:
  - `npm ci` - Instalación limpia de dependencias
  - `npm run lint` - Linting con ESLint
  - `npm run build` - Build con NestJS
  - `npm test` - Tests unitarios (si existen)

### Frontend CI (`.github/workflows/frontend-ci.yml`)
- Se ejecuta en cada PR que modifique archivos en `frontend/` o el workflow mismo
- Se ejecuta en push a `main` que modifique archivos en `frontend/`
- Ejecuta:
  - `npm ci` - Instalación limpia de dependencias
  - `npm run lint:tokens` - Guardia del sistema de estilos: falla si aparece
    `-oklch(` crudo, un token de color no definido en `app/globals.css`
    (`@theme`) o un `@import` de Google Fonts (debe usarse `next/font`)
  - `npm run lint` - Linting con Next.js ESLint
  - `npm run build` - Build de producción con Next.js

## Requisitos

- Node.js 20.x (configurado en los workflows)
- npm (lockfile: package-lock.json)

## Agregar Tests

### Backend (Jest)

Los tests del backend se ubican en `backend/src/**/*.spec.ts`. El backend ya cuenta con Jest configurado en `package.json`.

Ejemplo de test existente: `backend/src/auth/auth.service.spec.ts`

Para correr tests localmente:
```bash
cd backend
npm test
```

Para cobertura:
```bash
npm run test:cov
```

### Frontend

El frontend actualmente no tiene tests configurados. Se recomienda agregar:

1. **Testing Library + Jest** para tests unitarios de componentes
2. **Playwright** o **Cypress** para tests E2E

#### Opción recomendada: React Testing Library

Instalar dependencias:
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @types/jest ts-jest
```

Configurar `jest.config.js` en `frontend/`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
};
```

Agregar script a `package.json`:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

Ejemplo de test (`app/login/page.test.tsx`):
```typescript
import { render, screen } from '@testing-library/react';
import LoginPage from './page';

describe('LoginPage', () => {
  it('renderiza el formulario de login', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });
});
```

## Por qué es importante

Los bugs de build detectados en esta sesión (token mal referenciado, JSX roto, imports faltantes) habrían sido capturados automáticamente por CI antes de mergear. Con tests automatizados, las regresiones funcionales (como problemas de autenticación o permisos) también se detectarían inmediatamente.

## Próximos pasos recomendados

1. **Estabilizar build actual** - Asegurar que CI pase en verde antes de agregar más complejidad
2. **Agregar tests críticos** - Empezar con:
   - Backend: AuthService, guards de autorización, servicios core
   - Frontend: Componentes de autenticación, flujos principales
3. **Aumentar cobertura gradualmente** - Apuntar a >70% en módulos críticos
4. **Agregar tests E2E** - Para flujos completos de usuario (login → dashboard → acciones principales)
