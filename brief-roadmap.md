# PlannerApp — Brief #3: Roadmap MVP al 7 de Mayo

> Documento de trabajo interno. Define el estado actual del proyecto, las tareas pendientes y los deadlines exactos para entregar el MVP en ExpoSciencia.

**Fecha de inicio:** 27 de abril de 2026
**Deadline MVP:** 7 de mayo de 2026
**Días disponibles:** 10 días hábiles

---

## Resumen del Estado Actual

### ✅ Completado

| Área | Qué está hecho |
|---|---|
| **Infraestructura** | Monorepo configurado (mobile + web), TypeScript, Expo 55, React Navigation 7 |
| **Base de datos** | Schema Prisma completo: User, perfiles por rol, Event, Task, BudgetItem, EventVendor, Document |
| **Design System** | AppButton, AppInput, RoleCard, StepProgress, GuestRangeCard, EventTypeCard, SegmentedControl, CheckboxRow |
| **Auth UI — Login** | LoginScreen funcional |
| **Auth UI — Registro** | RegisterScreen (selección de rol) |
| **Auth UI — Cliente** | RegisterClientStep2 (nombre, ciudad, rango invitados) |
| **Auth UI — Cliente** | RegisterClientStep3 (tipos de evento preferidos) |
| **Auth UI — Cliente** | RegisterClientStep4 (datos fiscales: RFC, razón social, régimen fiscal) |
| **Auth UI — Planner** | RegisterPlannerStep2 (tipo empresa/independiente, especialidades) |
| **Auth UI — Planner** | RegisterPlannerStep3 (ciudades, nombre negocio, experiencia) |
| **Auth UI — Email** | EmailVerification (pantalla post-registro) |
| **Navegación** | RootNavigator con toda la pila de auth |
| **Estado global** | Zustand configurado |
| **Web — Setup** | Next.js 15 inicializado, Prisma + Neon configurados |

### ❌ Pendiente para MVP

- Registro de Proveedor (UI + flujo)
- Integración real de Clerk con la base de datos
- API Routes del backend
- Dashboards por rol (post-login)
- Módulo de Eventos (CRUD)
- Módulo de Tareas
- Módulo de Presupuesto
- Módulo de Proveedores (básico)
- Plataforma web Admin (panel de administración interno)

---

## Roadmap Detallado — 10 Días

---

### FASE 1 — Completar Auth + Backend Base
**📅 27 abril – 28 abril (Días 1–2)**

#### Día 1 — Lunes 27 de abril
**Objetivo: Cerrar el flujo de registro de Proveedor**

- [ ] `RegisterVendorStep2.tsx` — categoría de servicio, nombre del negocio, descripción
- [ ] `RegisterVendorStep3.tsx` — datos fiscales (RFC, razón social, régimen fiscal)
- [ ] Actualizar `RootNavigator` con las nuevas pantallas de Proveedor
- [ ] Actualizar `types.ts` con los parámetros de las rutas de Proveedor
- [ ] **Checkpoint:** Los 3 flujos de registro completos corren sin errores en simulador

#### Día 2 — Martes 28 de abril
**Objetivo: Conectar Clerk con la base de datos**

- [ ] API Route `POST /api/webhooks/clerk` — webhook que escucha `user.created` y sincroniza con PostgreSQL
- [ ] API Route `POST /api/users/profile` — guarda el perfil extendido (ClientProfile / PlannerProfile / VendorProfile) tras el onboarding
- [ ] API Route `GET /api/users/me` — retorna el usuario autenticado con su perfil
- [ ] Configurar variables de entorno en ambos proyectos (`.env.local`)
- [ ] Conectar `RegisterClientStep4`, `RegisterPlannerStep3` y `RegisterVendorStep3` con la API real
- [ ] **Checkpoint:** Un usuario puede registrarse, verificar email, y su perfil queda en PostgreSQL

---

### FASE 2 — Dashboards y Navegación Post-Login
**📅 29 abril – 30 abril (Días 3–4)**

#### Día 3 — Miércoles 29 de abril
**Objetivo: Estructura de navegación post-login y Dashboard del Cliente**

- [ ] Crear `MainNavigator.tsx` — Bottom Tab Navigator con rutas por rol
- [ ] Agregar lógica de routing: si el usuario ya está autenticado, ir a su dashboard
- [ ] `ClientDashboardScreen.tsx` — lista de eventos del cliente, acceso rápido a crear evento
- [ ] `PlannerDashboardScreen.tsx` — lista de eventos activos asignados al planner
- [ ] Integrar `GET /api/users/me` en el login para redirigir al dashboard correcto según rol
- [ ] **Checkpoint:** Login exitoso redirige al dashboard correspondiente según el rol

#### Día 4 — Jueves 30 de abril
**Objetivo: Dashboard del Planner y Proveedor + API de Eventos (lectura)**

- [ ] `VendorDashboardScreen.tsx` — vista de servicios ofrecidos y eventos en los que participa
- [ ] API Route `GET /api/events` — lista de eventos filtrada por rol del usuario autenticado
- [ ] API Route `GET /api/events/:id` — detalle de un evento con relaciones
- [ ] Conectar dashboards con la API
- [ ] **Checkpoint:** Cada rol ve su dashboard con datos reales de la BD

---

### FASE 3 — Módulo de Eventos
**📅 1 mayo – 2 mayo (Días 5–6)**

#### Día 5 — Viernes 1 de mayo
**Objetivo: Creación de eventos (Cliente)**

- [ ] `CreateEventScreen.tsx` — formulario multi-paso: tipo, fecha, lugar, aforo, presupuesto total
- [ ] API Route `POST /api/events` — crea evento vinculado al clientProfile
- [ ] Reutilizar `EventTypeCard` y otros componentes del design system
- [ ] Actualizar `ClientDashboardScreen` para reflejar el nuevo evento creado
- [ ] **Checkpoint:** Un cliente puede crear un evento desde su dashboard

#### Día 6 — Sábado 2 de mayo
**Objetivo: Detalle del evento y asignación de planner**

- [ ] `EventDetailScreen.tsx` — vista completa del evento con tabs: Resumen / Tareas / Presupuesto / Proveedores
- [ ] `AssignPlannerModal.tsx` — selector de planner disponible con búsqueda simple
- [ ] API Route `POST /api/events/:id/planners` — asigna un planner al evento
- [ ] API Route `DELETE /api/events/:id/planners/:plannerId` — desvincula planner
- [ ] **Checkpoint:** Cliente puede ver el detalle de su evento y asignar un planner

---

### FASE 4 — Módulo de Tareas
**📅 3 mayo (Día 7)**

#### Día 7 — Domingo 3 de mayo
**Objetivo: Gestión de tareas por evento (vista de lista, no kanban completo)**

- [ ] `TaskListScreen.tsx` — lista de tareas del evento, agrupadas por status (TODO / IN_PROGRESS / DONE)
- [ ] `TaskCard.tsx` — componente de tarea con título, prioridad, fecha de vencimiento
- [ ] `CreateTaskModal.tsx` — formulario: título, descripción, prioridad, fecha vencimiento
- [ ] API Route `GET /api/events/:id/tasks` — lista de tareas del evento
- [ ] API Route `POST /api/events/:id/tasks` — crea tarea
- [ ] API Route `PATCH /api/tasks/:id` — actualiza status / datos de la tarea
- [ ] **Checkpoint:** Planner puede crear, ver y cambiar el status de tareas

---

### FASE 5 — Módulo de Presupuesto
**📅 4 mayo (Día 8)**

#### Día 8 — Lunes 4 de mayo
**Objetivo: Control de presupuesto por evento**

- [ ] `BudgetScreen.tsx` — resumen de presupuesto total vs. gasto real, lista de ítems
- [ ] `BudgetItemCard.tsx` — ítem con categoría, monto estimado vs. real, status
- [ ] `AddBudgetItemModal.tsx` — formulario: categoría, descripción, monto estimado
- [ ] API Route `GET /api/events/:id/budget` — lista de ítems de presupuesto con totales
- [ ] API Route `POST /api/events/:id/budget` — agrega ítem al presupuesto
- [ ] API Route `PATCH /api/budget/:id` — actualiza monto real y status del ítem
- [ ] **Checkpoint:** Planner puede registrar gastos y ver el presupuesto vs. gasto real

---

### FASE 6 — Módulo de Proveedores (básico)
**📅 5 mayo (Día 9 — mañana)**

**Objetivo: Vincular proveedores a un evento**

- [ ] `VendorListScreen.tsx` — directorio de proveedores registrados en la app, filtrable por categoría
- [ ] `AssignVendorModal.tsx` — asigna un proveedor al evento con precio acordado y notas
- [ ] API Route `GET /api/vendors` — lista de proveedores con sus servicios
- [ ] API Route `POST /api/events/:id/vendors` — vincula proveedor al evento
- [ ] API Route `PATCH /api/events/:id/vendors/:vendorId` — actualiza status (PENDING → CONFIRMED)
- [ ] **Checkpoint:** Planner puede buscar proveedores y asignarlos a un evento

---

### FASE 7 — Plataforma Web Admin
**📅 5 mayo (tarde) – 6 mayo (Días 9–10)**

**Objetivo: Panel interno para supervisar la plataforma**

> Esta plataforma es de uso exclusivo del equipo. No requiere diseño elaborado — funcionalidad sobre estética.

#### Día 9 (tarde) — Lunes 5 de mayo
- [ ] Layout base del admin: sidebar + header con info de sesión
- [ ] Página `/admin` — dashboard con métricas clave:
  - Total de usuarios registrados (por rol)
  - Total de eventos (por status)
  - Nuevos registros en los últimos 7 días
- [ ] API Route `GET /api/admin/stats` — retorna las métricas del dashboard

#### Día 10 — Martes 6 de mayo
- [ ] Página `/admin/users` — tabla de todos los usuarios con: nombre, email, rol, fecha de registro
- [ ] Página `/admin/events` — tabla de todos los eventos con: título, cliente, planner asignado, status, fecha
- [ ] Filtros básicos por rol / status en las tablas
- [ ] Proteger las rutas `/admin/*` con middleware (solo usuarios con rol ADMIN)
- [ ] **Checkpoint:** El equipo puede ver todos los usuarios y eventos desde el panel web

---

### DÍA FINAL — QA y Entrega
**📅 7 mayo — Miércoles**

- [ ] Smoke test completo del flujo end-to-end en iOS y Android
- [ ] Revisar que todos los flujos de registro funcionan (los 3 roles)
- [ ] Verificar que el login redirige correctamente por rol
- [ ] Probar creación de evento → asignación de planner → tareas → presupuesto
- [ ] Corregir errores críticos de UI o de API
- [ ] Build de Expo para demo (EAS Build o Expo Go)
- [ ] Preparar datos de demostración en la BD (seed con usuarios/eventos de ejemplo)
- [ ] **MVP LISTO para ExpoSciencia 🚀**

---

## Resumen Visual del Roadmap

```
ABRIL                              MAYO
27  28  29  30  | 01  02  03  04  05  06  07
──────────────────────────────────────────────
[1][2]           → Fase 1: Auth + Backend Base
     [3][4]      → Fase 2: Dashboards + Navegación
          [5][6] → Fase 3: Módulo Eventos
               [7] → Fase 4: Módulo Tareas
                  [8] → Fase 5: Presupuesto
                     [9] → Fase 6: Proveedores
                     [9][10] → Fase 7: Admin Web
                           [🚀] → MVP + Demo
```

---

## Prioridades si el tiempo es insuficiente

Si hay retrasos, el orden de sacrificio es:

1. **Proveedor dashboard** — puede simplificarse a una pantalla placeholder
2. **Módulo de Proveedores en móvil** — puede omitirse del MVP y mostrarse como "próximamente"
3. **Asignación de planner desde la app** — puede hacerse directo en admin web
4. **Admin Web completo** — basta con mostrar la página de stats básicas

**Lo que NO puede cortarse del MVP:**
- Los 3 flujos de registro completos
- Login + redirect por rol
- Dashboard funcional del Cliente y Planner
- Creación de evento
- Gestión de tareas (aunque sea lista simple)
- Control de presupuesto básico

---

## Dependencias Técnicas Críticas

| Dependencia | Impacto | Acción requerida |
|---|---|---|
| Variables de entorno Clerk (Webhook Secret, Publishable Key) | Bloquea toda la integración auth-BD | Configurar el día 2 |
| `DATABASE_URL` de Neon | Bloquea API Routes | Verificar conexión en Neon dashboard |
| `npx prisma migrate dev` | El schema debe estar migrado a la BD | Ejecutar en Día 2 antes de las API Routes |
| EAS CLI (para build de demo) | Bloquea la demo en dispositivo físico | Instalar y configurar el Día 9 |

---

*Brief #3 — Roadmap interno · PlannerApp · ExpoSciencia Mayo 2026*
