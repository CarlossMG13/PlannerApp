# PlannerApp

Plataforma para organizar eventos en México. Conecta tres roles: **Cliente**, **Planner** y **Proveedor**.

## Estructura

```
PlannerApp/   → App móvil pública (React Native + Expo)
web/          → Admin interno del equipo (Next.js + Prisma + PostgreSQL)
```

## Stack

| | Tecnología |
|---|---|
| Mobile | React Native 0.83 + Expo 55 + TypeScript |
| Navegación | React Navigation 7 (Native Stack + Bottom Tabs) |
| Estado | Zustand |
| Auth | Clerk (`@clerk/clerk-expo`) |
| Backend | Next.js 15 (App Router + API Routes) |
| ORM / BD | Prisma + PostgreSQL (Neon serverless) |
| Animaciones | Moti + Reanimated 4 |

## Roles

- **Cliente** — organiza su propio evento
- **Planner** — gestiona eventos para terceros (empresa o independiente)
- **Proveedor** — ofrece servicios (catering, fotografía, música, etc.)

## Contexto

- Mercado: México — moneda MXN, datos fiscales (RFC, Razón Social, Régimen Fiscal)
- Deadline MVP: **7 de mayo de 2026** (ExpoSciencia universitaria)
- Roadmap detallado: `brief-roadmap.md`
- Schema de BD: `web/prisma/schema.prisma`
