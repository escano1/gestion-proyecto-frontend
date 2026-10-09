# 🎨 Frontend - Next.js + React + TailwindCSS

Interfaz web moderna para sistema de gestión de proyectos y nómina.

**Stack**: Next.js 14+ | React 18+ | TypeScript | TailwindCSS | Zod  
**Puerto**: `3000` (Next.js dev) | `3001` (fallback)

---

## 🎯 Propósito

Proporcionar interfaz intuitiva y responsiva para:
- Autenticación y gestión de sesión (JWT)
- CRUD de trabajadores, proyectos
- Captura rápida de horas trabajadas
- Consulta de nómina y descargas (PDF, Excel)
- Reportes y dashboards
- Validación client-side + server-side

---

## 📁 Estructura

```
src/
├── app/
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── logout/page.tsx
│   │
│   └── (dashboard)/
│       ├── layout.tsx               # Sidebar + navbar
│       ├── dashboard/page.tsx       # Dashboard principal
│       ├── trabajadores/page.tsx    # CRUD
│       ├── proyectos/page.tsx       # CRUD
│       ├── registro-horas/page.tsx  # Captura rápida (CRÍTICA)
│       ├── nomina/page.tsx          # Listado y detalle
│       ├── reportes/page.tsx        # Reportes y gráficos
│       └── configuracion/page.tsx   # Parámetros
│
├── components/
│   ├── layout/                      # Layout components
│   ├── forms/                       # Formularios
│   ├── tables/                      # Tablas con datos
│   ├── modals/                      # Diálogos
│   └── ui/                          # Componentes base
│
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── useForm.ts
│   └── usePermissions.ts
│
├── lib/
│   ├── api.ts                       # Cliente HTTP
│   ├── auth.ts                      # JWT management
│   ├── formatter.ts                 # Formato moneda, fechas
│   └── validadores.ts               # Schemas Zod
│
├── types/
│   └── index.ts                     # Tipos compartidos
│
├── store/
│   └── useAuthStore.ts              # Zustand state
│
└── styles/
    └── globals.css                  # TailwindCSS
```

---

## 🚀 Quick Start

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Ambiente
Crear `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Iniciar Desarrollo
```bash
npm run dev
# → http://localhost:3000
```

---

## 🔐 Autenticación

- JWT: Access token (15 min) + Refresh token (7 días)
- Interceptor HTTP automático
- Zustand para estado global
- localStorage (encriptado)

---

## 🎨 Componentes Base

- Button, Input, Select, Card, Alert, Spinner
- TailwindCSS para estilos
- Validación con Zod + React Hook Form

---

## 📝 Validación

### Schemas Centralizados
```typescript
// lib/validadores.ts
export const registroHorasSchema = z.object({
  cantidadHoras: z.number().min(0.5).max(12),
  // ...
});
```

### Validación Server
El backend SIEMPRE valida también (seguridad).

---

## 📱 Responsivo

- Mobile first approach
- Breakpoints: sm, md, lg, xl, 2xl
- TailwindCSS responsive utilities

---

## 🧪 Testing

```bash
npm test                    # Todos los tests
npm test -- --coverage      # Con cobertura
```

**Target**: 70%+ coverage en componentes

---

## 🚀 Comandos

```bash
npm run dev               # Desarrollo
npm run build             # Build
npm run start             # Run build
npm run lint              # Linter
npm run format            # Prettier
npm run type-check        # TypeScript
npm test                  # Tests
```

---

## 🔗 Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TailwindCSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

---

## 📋 Checklist Antes de Push

- [ ] Tests pasando
- [ ] TypeScript sin errores
- [ ] Linting correcto
- [ ] Responsivo en mobile
- [ ] Sin console.log en production
- [ ] Accesibilidad checkeada

---

**Estado**: 📋 Documentación completada (desarrollo pendiente)  
**Próximo**: Fase 0 - Setup inicial  
**Actualizado**: 2026-10-08
