# Gestión de Proyectos y Nómina — Frontend

Aplicación web para gestionar proyectos de ingeniería eléctrica, capturar horas trabajadas y consultar la nómina colombiana.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query · React Hook Form + Zod · Recharts · Despliegue en Vercel.
Consume la API de [`gestion-proyecto-backend`](https://github.com/escano1/gestion-proyecto-backend) (vea su README para levantarla en local); contrato en [`docs/API.md`](https://github.com/escano1/gestion-proyecto-claude/blob/main/docs/API.md).

## Desarrollo local

Requisitos: Node.js 24.15+ (recomendado, igual que el CI) o 22.22.2+ de la línea 22, y la API corriendo (por defecto en `http://localhost:3001/api`).

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm ci
npm run dev                    # http://localhost:3000
```

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run lint` · `npm run typecheck` | ESLint y TypeScript (genera los tipos de rutas) |
| `npm test` | Pruebas (Vitest + Testing Library) |

## Estructura

```
src/
├── app/
│   ├── login/                    # inicio de sesión
│   └── (app)/                    # área autenticada (layout con guard de sesión y menú por rol)
│       ├── dashboard · proyectos/[id] · trabajadores/[id]
│       ├── registro-horas (captura semanal) · registro-horas/historial
│       ├── nomina · nomina/[id] · nomina/desprendibles/[id]
│       ├── reportes · auditoria · perfil
│       └── configuracion/parametros · configuracion/usuarios
├── features/<dominio>/api.ts     # hooks de datos (TanStack Query) — único punto de acceso al API
├── features/<dominio>/*.tsx      # formularios y componentes de cada pantalla
├── components/ui · layout        # componentes base reutilizables
├── lib/                          # cliente HTTP con refresh de token, sesión (Zustand), formato, permisos
└── types/api.ts                  # tipos del contrato de la API
```

**Sesión:** el login guarda el token de acceso (15 min) y el de refresco (7 días) en `localStorage`; el cliente HTTP renueva el acceso automáticamente y, si el refresco falla, cierra la sesión y vuelve a `/login`.
**Roles:** el menú y las acciones se adaptan al rol (`ADMIN`, `GESTOR_PROYECTOS`, `NOMINA`, `CONSULTA`); la API valida los permisos de todos modos.

## Despliegue en Vercel

1. **Add New → Project** e importe el repositorio `escano1/gestion-proyecto-frontend` (Vercel detecta Next.js; no requiere configuración adicional).
2. Variable de entorno (Production y Preview):
   `NEXT_PUBLIC_API_URL = https://<servicio>.up.railway.app/api`
3. Deploy. Luego agregue el dominio de Vercel a `CORS_ORIGINS` del servicio en Railway (p. ej. `https://gestion-proyectos.vercel.app`).

`NEXT_PUBLIC_API_URL` se incrusta en el build: si cambia la URL de la API, vuelva a desplegar.
