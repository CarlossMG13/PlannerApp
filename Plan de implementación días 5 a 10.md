# Plan de Implementación — Días 5 a 10 (Fases 3 a 7) + Día Final

> Documento de trabajo. Plan crítico, accionable y con archivos exactos para los días 1 al 7 de mayo 2026.

---

## Estado Asumido al Final del Día 4

Este plan asume que las Fases 1 y 2 cerraron sus checkpoints. Si algo de esto no está, no se puede arrancar el Día 5 sin riesgo:

- ✅ Los 3 roles pueden registrarse, verificar email, y aterrizar en su dashboard.
- ✅ `User` + perfil de rol se crean correctamente en PostgreSQL.
- ✅ Webhook Clerk con verificación de firma + idempotencia.
- ✅ `apiFetch` con JWT Clerk en mobile.
- ✅ Middleware Clerk en `/web` protegiendo toda `/api/*` excepto el webhook y categories.
- ✅ Dashboards leen `GET /api/events` y muestran lo que corresponde a su rol.
- ✅ Design system extendido: `EventCard`, `StatusBadge`, `EmptyState`.

Si alguno de estos puntos quedó pendiente, **se trae al Día 5 antes de avanzar** — no se acumula deuda técnica en módulos posteriores.

---

## Auditoría del Roadmap Original (Fases 3-7)

El roadmap original es ambicioso. Estos son los huecos críticos no resueltos:

| Tema | Hueco identificado |
|---|---|
| **Crear evento** | El roadmap dice "formulario multi-paso" sin definir si el cliente puede crear un evento sin planner asignado, o si la asignación es obligatoria. **Decisión pendiente.** |
| **Asignación de planner** | ¿Quién decide quién es el planner? ¿El cliente busca y elige? ¿Hay un directorio? ¿Solo se invita por email? El roadmap no lo aclara. |
| **Tareas — quién crea/asigna** | Solo el planner asigna tareas, o también el cliente puede crear tareas para sí mismo. Schema permite ambos casos. **Decisión pendiente.** |
| **Presupuesto — categorías** | `BudgetItem.category` es `String` libre. Sin lista cerrada, cada planner inventa categorías y se rompe la consistencia entre eventos. |
| **Proveedores — directorio** | ¿Búsqueda por categoría/ciudad/precio? ¿Filtros? El roadmap solo dice "filtrable por categoría" — insuficiente para UX decente. |
| **Admin web — login separado** | ¿Mismo Clerk con check de role? ¿Subdominio distinto? El roadmap no define la estrategia de gating. |
| **EventStatus DRAFT vs ACTIVE** | No está definido qué transición convierte DRAFT en ACTIVE. ¿Auto cuando se asigna planner? ¿Manual del cliente? |
| **Notificaciones** | El roadmap explícitamente saca push notifications del MVP, pero el flujo de "asignar tarea a usuario" sin notificación es UX rota — el asignado nunca se entera. |

---

## Decisiones que necesito antes de arrancar

Te las pongo como las anteriores, con mi recomendación marcada **→**.

### 9. ¿Crear evento sin planner asignado?
- **(A)** Sí — el cliente crea evento DRAFT, lo asigna a un planner después. **→ Recomendado.** Es UX más natural y desbloquea casos donde el cliente aún no decidió planner.
- **(B)** No — la asignación es obligatoria al crear.

### 10. ¿Cómo encuentra el cliente a su planner?
- **(A)** Directorio público de planners filtrable por ciudad/especialidad. **→ Recomendado.** Funciona como demo en ExpoSciencia.
- **(B)** Solo por código de invitación (planner comparte un código → cliente lo pega).
- **(C)** Solo por búsqueda directa por email/nombre.

### 11. Transición DRAFT → ACTIVE
- **(A)** **Manual** — el cliente toca un botón "Publicar evento" cuando está listo. **→ Recomendado.** Da control y evita que se "active" un evento incompleto.
- **(B)** **Automático** al asignar el primer planner.

### 12. Tareas — quién puede crear y asignar
- **(A)** Solo planners asignados al evento crean tareas. Cliente solo lee. **→ Recomendado para MVP.** Coherente con "el planner gestiona, el cliente supervisa".
- **(B)** Cliente y planner pueden crear; cualquiera asigna a cualquiera.
- **(C)** Cliente puede crear tareas "para mí" pero no asignar a otros.

### 13. Presupuesto — categorías
- **(A)** Lista cerrada pre-definida (Catering, Decoración, Música, Fotografía, Salón, Otros…). **→ Recomendado.** Permite agregar reportes por categoría comparables entre eventos.
- **(B)** Texto libre (status quo del schema).
- **(C)** Mixto: sugerir categorías comunes con opción "personalizada".

### 14. Notificaciones in-app de tareas asignadas
- **(A)** Sin notificaciones. El asignado debe abrir la tab de tareas. **→ Aceptable para MVP** si lo entendemos como limitación conocida.
- **(B)** Badge numérico en el tab "Eventos" indicando tareas pendientes asignadas a ti. **→ Yo lo recomiendo si hay tiempo.** No es push, es un contador local que se actualiza con polling/refetch.
- **(C)** Email de notificación al asignar. **→ Demasiado para 1 día.**

### 15. Admin web — login y gating
- **(A)** Mismo Clerk. Página `/admin/*` protegida con middleware que verifica `User.role === 'ADMIN'` consultando Postgres. **→ Recomendado.** Sin sistema de auth duplicado.
- **(B)** Subdominio distinto + login separado.
- **(C)** Página pública con magic link enviado a `ADMIN_EMAILS`.

### 16. Admin web — UI library
- **(A)** **shadcn/ui + Tailwind**. Es un panel interno: instalar shadcn, copiar 4-5 componentes (Table, Card, Button, Badge, Sidebar) y listo. **→ Recomendado.**
- **(B)** Tailwind puro con componentes propios.
- **(C)** Mantener `globals.css` de Next default sin Tailwind. **No recomendado** — implica diseñar todo from scratch.

### 17. Búsqueda y filtros del directorio de proveedores
- **(A)** **Filtros mínimos:** categoría + ciudad. Búsqueda por nombre. **→ Recomendado.**
- **(B)** Filtros avanzados: rango de precio, calificación, disponibilidad por fecha. **→ Demasiado para 1 día.**
- **(C)** Solo lista plana sin filtros. **No.**

### 18. EAS Build para demo
- **(A)** **EAS Build con perfil `preview`**, distribución por internal QR. **→ Recomendado.** Compilación remota, no requiere Xcode/Android Studio.
- **(B)** Expo Go. **Limitación grave:** Expo Go no soporta plugins nativos no incluidos (puede romper con `expo-secure-store`). **No recomendado** para demo física en stand.
- **(C)** Build local con `npx expo run:android`. Requiere setup completo.

### 19. Datos seed para demo
- ¿Cuántos usuarios/eventos quieres en la BD para la demo? Mi propuesta:
  - 3 clientes ficticios (uno con boda DRAFT, otro con boda ACTIVE, otro con boda IN_PROGRESS).
  - 2 planners (uno empresa, uno independiente).
  - 5 proveedores cubriendo 5 categorías distintas.
  - 1 evento completo con tareas, presupuesto y vendors asignados.
- Esto se carga con `prisma/seed.ts` ampliado (Día 11).

---

## DÍA 5 — Viernes 1 de mayo
### Fase 3: Crear evento (Cliente)

### 5.1 — `CreateEventScreen` (multi-step)
**Archivo nuevo:** `PlannerApp/src/app/main/client/CreateEventScreen.tsx`

**Decisión de diseño UX:** un solo `ScrollView` con secciones colapsables, no un wizard de 4 pantallas. Razón: el formulario es corto, no hay validaciones cruzadas entre pasos, y un wizard se siente sobrediseñado para 5 campos.

Secciones:
1. **Tipo** — dropdown con `EventType` enum (5 opciones).
2. **Nombre** — `AppInput` "ej. Boda de Ana y Luis".
3. **Fecha y hora** — date+time picker. **→ Decisión:** ¿usamos `@react-native-community/datetimepicker`? Sí, es el estándar y ya cubre iOS+Android.
4. **Ubicación** — campos `venueName` y `venueAddress`. Sin geocoding por ahora.
5. **Aforo estimado** — `AppInput` numérico.
6. **Presupuesto total** — `AppInput` numérico, formato MXN.

Validación con state local (sin Zod en mobile, validación final está en API). Botón "Crear" deshabilitado si falta cualquier required.

### 5.2 — Endpoint `POST /api/events`
**Archivo nuevo:** `web/src/app/api/events/route.ts` (extiende el GET de Día 4)

- Auth + autorización: solo `CLIENT` puede crear (no PLANNER ni VENDOR).
- Validación con Zod: `eventDate` debe ser futura, `guestCount` ≥ 1, `totalBudget` ≥ 0.
- Crea con `status: DRAFT` automático.
- Vincula a `currentUser.clientProfile.id`.
- Devuelve el evento creado.

### 5.3 — `useCreateEvent` hook
**Archivo nuevo:** `PlannerApp/src/hooks/useCreateEvent.ts`
- Mutation pattern: `mutate(data)`, `isLoading`, `error`, callback `onSuccess`.

### 5.4 — Refrescar `ClientDashboardScreen`
- Después de crear, hacer `refetch` de la lista de eventos.
- Navegación: post-create → `EventDetailScreen` del evento recién creado.

### 5.5 — Components del design system
**Archivos nuevos:**
- `PlannerApp/src/components/ui/DateTimePicker.tsx` — wrapper sobre `@react-native-community/datetimepicker` con UX consistente.
- `PlannerApp/src/components/ui/CurrencyInput.tsx` — input con formato MXN, separadores de miles, símbolo `$`.

### Checkpoint Día 5
- [ ] Cliente crea evento desde dashboard, aparece en lista, status DRAFT.
- [ ] Validación server-side rechaza eventos con fecha pasada o presupuesto negativo.
- [ ] Cliente NO puede crear evento si su rol es PLANNER o VENDOR (403).

---

## DÍA 6 — Sábado 2 de mayo
### Fase 3: Detalle del evento + asignación de planner + transición DRAFT → ACTIVE

### 6.1 — `EventDetailScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/event/EventDetailScreen.tsx`

Layout:
- Header: nombre del evento + status badge + botón back.
- Hero card: fecha, lugar, aforo, presupuesto total.
- **Tabs internos** (Material Top Tabs o segmented control): Resumen / Tareas / Presupuesto / Proveedores.
  - Resumen: descripción + planners asignados + acciones rápidas.
  - Tareas: placeholder hoy, se llena Día 7.
  - Presupuesto: placeholder hoy, se llena Día 8.
  - Proveedores: placeholder hoy, se llena Día 9.
- **Botón "Publicar evento"** visible solo si `status === DRAFT` y current user es el cliente dueño.

**Decisión de diseño UX:** tabs internos con `react-native-pager-view` en lugar de scroll vertical infinito. Razón: cada módulo (tareas/presupuesto/proveedores) es lo suficientemente pesado como para merecer su propio espacio. Carga lazy del contenido del tab.

### 6.2 — Directorio de planners + `AssignPlannerScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/client/AssignPlannerScreen.tsx`

- Lista de planners con `FlatList`.
- Búsqueda por nombre/ciudad.
- Tap en card abre modal con detalle (bio, especialidades, portfolio si existe) + botón "Asignar a mi evento".

### 6.3 — Endpoint `GET /api/planners` (público para usuarios autenticados)
**Archivo nuevo:** `web/src/app/api/planners/route.ts`

- Cualquier user autenticado puede listar planners.
- Filtros query params: `?city=&search=&limit=20&cursor=`.
- Excluye campos sensibles (email, RFC) — devuelve solo info de directorio.

### 6.4 — Endpoint `POST /api/events/:id/planners`
**Archivo nuevo:** `web/src/app/api/events/[id]/planners/route.ts`

- Solo el cliente dueño del evento puede asignar planners.
- Validación: `plannerId` existe, evento existe, no duplicar `EventPlanner`.
- Si es el primer planner → `isLead: true`.
- Si ya hay un lead → el nuevo es `isLead: false` por default.

### 6.5 — Endpoint `DELETE /api/events/:id/planners/:plannerId`
- Solo el cliente dueño puede desvincular.
- Si se elimina el lead, el siguiente planner asignado pasa a lead automáticamente.

### 6.6 — Endpoint `PATCH /api/events/:id` para cambiar status
- Cliente dueño puede cambiar `DRAFT → ACTIVE` y `ACTIVE → CANCELLED`.
- Planner asignado puede cambiar `ACTIVE → IN_PROGRESS` y `IN_PROGRESS → COMPLETED`.
- Otros transitions → 400.
- Validación: para pasar a ACTIVE, el evento debe tener al menos 1 planner asignado.

### 6.7 — Hook `useEventDetail`
**Archivo nuevo:** `PlannerApp/src/hooks/useEventDetail.ts`
- Fetch de un evento por id con relaciones.
- Refetch on mount + manual refresh.

### Checkpoint Día 6
- [ ] Cliente abre detalle del evento y ve resumen completo.
- [ ] Cliente busca planners en directorio y asigna uno a su evento.
- [ ] Cliente publica evento (DRAFT → ACTIVE) solo después de asignar planner.
- [ ] Cualquier intento no autorizado de modificar el evento devuelve 403.

---

## DÍA 7 — Domingo 3 de mayo
### Fase 4: Módulo de Tareas

### 7.1 — Tab "Tareas" del `EventDetailScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/event/tabs/TasksTab.tsx`

Layout:
- Lista agrupada por status: TODO / IN_PROGRESS / DONE.
- Cada grupo es colapsable, con contador.
- Botón flotante "+" para crear tarea (solo visible para planners asignados).
- Pull to refresh.

**Decisión UX:** agrupada por status en lista vertical, no Kanban horizontal. Razón: en mobile, kanban horizontal con scroll lateral es UX deficiente para listas largas. Vertical agrupada es estándar (Asana, Trello mobile).

### 7.2 — `TaskCard` component
**Archivo nuevo:** `PlannerApp/src/components/ui/TaskCard.tsx`
- Título + descripción truncada.
- Badge de prioridad (LOW gris / MEDIUM amarillo / HIGH rojo).
- Avatar/nombre del asignado.
- Fecha de vencimiento con color rojo si vencida.
- Tap → abre `TaskDetailModal` con acciones (cambiar status, editar, eliminar).

### 7.3 — `CreateTaskModal`
**Archivo nuevo:** `PlannerApp/src/components/modals/CreateTaskModal.tsx`
- Sheet modal (Moti).
- Campos: título, descripción, prioridad, fecha vencimiento, asignado.
- "Asignado": dropdown con cliente del evento + planners asignados al evento. (No vendors — los vendors no son operativos del equipo.)

### 7.4 — Endpoints de tareas
**Archivo nuevo:** `web/src/app/api/events/[id]/tasks/route.ts`

- `GET` → lista de tareas del evento. Cualquier autorizado del evento (cliente/planner/vendor) puede leer.
- `POST` → crear tarea. **Solo planners asignados al evento.** Cliente NO puede crear.

**Archivo nuevo:** `web/src/app/api/tasks/[id]/route.ts`
- `PATCH` → editar status, datos. Quién puede:
  - Cambiar status: el asignado o cualquier planner del evento.
  - Editar otros campos: solo planners del evento.
- `DELETE` → solo planners del evento.

### 7.5 — Validación de tareas
- Zod: `priority` enum, `status` enum, `dueDate` futura o null, `assignedToId` debe ser usuario válido relacionado al evento (cliente o planner).
- En `PATCH` con cambio de status: validar transición legal (no se puede pasar de DONE a TODO sin razón — pero por simplicidad MVP, permitimos cualquier transición y lo anotamos como "permitido para MVP").

### 7.6 — Counter de tareas pendientes en tab "Eventos"
Si la decisión #14 fue **(B)** (badge numérico):
- `useEvents` ahora también devuelve `pendingTasksCount` por evento.
- Tab "Eventos" muestra dot/badge con suma de tareas TODO+IN_PROGRESS asignadas al usuario.

### Checkpoint Día 7
- [ ] Planner crea tareas, las asigna, cambia status.
- [ ] Cliente lee tareas pero NO puede crear/editar (403).
- [ ] Tareas vencidas se ven en rojo.
- [ ] Editar tarea no autorizada → 403.

---

## DÍA 8 — Lunes 4 de mayo
### Fase 5: Módulo de Presupuesto

### 8.1 — Tab "Presupuesto" del `EventDetailScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/event/tabs/BudgetTab.tsx`

Layout:
- **Header con resumen visual:** barra de progreso "Gastado vs Presupuesto total".
  - `actualAmount` totales / `Event.totalBudget`.
  - Si excede el 100%: barra roja + mensaje "Presupuesto excedido en $X".
- Resumen por categoría (gráfico de barras simple en `react-native` con `<View>` de altura proporcional, sin librería de charts — eso pesa demasiado).
- Lista de `BudgetItem` agrupados por categoría.
- Botón "+" flotante para crear ítem (solo planners + cliente dueño).

### 8.2 — `BudgetItemCard` component
**Archivo nuevo:** `PlannerApp/src/components/ui/BudgetItemCard.tsx`
- Categoría + descripción.
- Estimado vs real (real en bold).
- Badge de status: ESTIMATED / CONFIRMED / PAID.
- Tap → modal de edición.

### 8.3 — `AddBudgetItemModal`
**Archivo nuevo:** `PlannerApp/src/components/modals/AddBudgetItemModal.tsx`
- Categoría: dropdown con lista cerrada (decisión #13).
- Descripción.
- Monto estimado (`CurrencyInput`).
- Status: default `ESTIMATED`.

**Lista de categorías de presupuesto** (si decisión #13 fue **A**):
- Banquete y Catering
- Decoración y Flores
- Salón / Venue
- Música y Entretenimiento
- Fotografía y Video
- Pastel y Postres
- Bar y Bebidas
- Vestuario
- Maquillaje y Estilismo
- Invitaciones
- Mobiliario
- Transporte
- Hospedaje
- Otros

### 8.4 — Endpoints de presupuesto
**Archivo nuevo:** `web/src/app/api/events/[id]/budget/route.ts`
- `GET` → lista de items + totales agregados (`SUM(estimatedAmount)`, `SUM(actualAmount)`, agregado por categoría).
- `POST` → crear item. **Solo cliente dueño + planners asignados.** Vendor NO ve presupuesto.

**Archivo nuevo:** `web/src/app/api/budget/[id]/route.ts`
- `PATCH` → editar (cambiar `actualAmount` cuando se confirma o paga, cambiar status).
- `DELETE` → eliminar item.

### 8.5 — Restricción de visibilidad
- En `GET /api/events/:id/budget` y `GET /api/events/:id`, **excluir presupuesto del response si current user es VENDOR**. El vendor no debe saber el presupuesto del evento.

### 8.6 — Hook `useBudget`
- Encapsula GET de presupuesto + computa totales en frontend para evitar llamada extra.

### Checkpoint Día 8
- [ ] Cliente y planner crean items de presupuesto, los confirman, los marcan como pagados.
- [ ] Barra de progreso refleja gasto real vs total.
- [ ] Vendor NO ve el tab presupuesto del evento (botón oculto + 403 si lo llama directo).

---

## DÍA 9 — Martes 5 de mayo
### Fase 6 (mañana): Proveedores básico  +  Fase 7 (tarde): Admin web setup

### 9.1 — Tab "Proveedores" del `EventDetailScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/event/tabs/VendorsTab.tsx`

Layout:
- Lista de `EventVendor` actuales con status (PENDING / CONFIRMED / CANCELLED).
- Botón "+" para asignar nuevo proveedor (solo planners + cliente dueño).

### 9.2 — `VendorDirectoryScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/event/VendorDirectoryScreen.tsx`

Layout:
- Filtros: dropdown de categoría + input de búsqueda + chip de ciudad opcional.
- Lista de vendors filtrada con `FlatList`.
- Card de vendor con: nombre del negocio, categoría, rating placeholder, ciudad.
- Tap → `AssignVendorModal`.

### 9.3 — `AssignVendorModal`
- Selección de servicio (si el vendor tiene `VendorService` registrados).
- Precio acordado (`CurrencyInput`, default = `service.basePrice`).
- Notas.
- Status default: `PENDING`.

### 9.4 — Endpoints de proveedores
**Archivo nuevo:** `web/src/app/api/vendors/route.ts`
- `GET` → directorio público para autenticados. Filtros: `?categoryId=&search=&limit=`.

**Archivo nuevo:** `web/src/app/api/events/[id]/vendors/route.ts`
- `GET` → vendors del evento.
- `POST` → asignar vendor. Solo cliente dueño + planners.

**Archivo nuevo:** `web/src/app/api/events/[id]/vendors/[vendorId]/route.ts`
- `PATCH` → cambiar status (PENDING → CONFIRMED → CANCELLED).
- `DELETE` → desvincular.

### Checkpoint Fase 6 (Día 9 — 12:00)
- [ ] Cliente busca vendor por categoría y ciudad, lo asigna al evento con precio acordado.
- [ ] Planner cambia status del vendor a CONFIRMED.
- [ ] Vendor ve en su dashboard que está asignado a un evento.

---

### 9.5 — Setup Admin Web

**Decisión:** asumiendo decisión #16 = **shadcn/ui + Tailwind**.

#### Instalación
- `cd web && npm install -D tailwindcss postcss autoprefixer`
- `npx tailwindcss init -p`
- `npx shadcn@latest init`
- `npx shadcn@latest add button card table badge sidebar dropdown-menu input`

#### Estructura de carpetas
```
web/src/app/
├── (admin)/                ← grupo de rutas con layout propio
│   ├── layout.tsx          ← sidebar + header con info de sesión
│   ├── admin/
│   │   ├── page.tsx        ← /admin (dashboard)
│   │   ├── users/page.tsx  ← /admin/users
│   │   └── events/page.tsx ← /admin/events
```

#### Middleware de admin
**Archivo:** `web/src/middleware.ts` (extender el existente)
- Si la ruta empieza con `/admin`, además de auth de Clerk, verificar `User.role === 'ADMIN'` consultando Postgres.
- Si no es admin → redirect a `/` con flash message "No tienes permisos".

**Crítico de seguridad:** la verificación de rol se hace en cada request mediante un endpoint helper, no se confía en el JWT (el rol puede cambiar y el JWT viejo seguir siendo válido durante la ventana de expiración).

#### Layout del admin
**Archivo:** `web/src/app/(admin)/layout.tsx`
- Sidebar con links: Dashboard / Usuarios / Eventos.
- Header con nombre del admin + botón "Cerrar sesión" (`<SignOutButton>` de Clerk).
- Container central con padding generoso.

#### Página `/admin` (dashboard de stats)
**Archivo:** `web/src/app/(admin)/admin/page.tsx`

Cards con stats clave:
- Total de usuarios (separado por rol: CLIENT / PLANNER / VENDOR).
- Total de eventos por status (DRAFT / ACTIVE / IN_PROGRESS / COMPLETED).
- Nuevos registros últimos 7 días.
- Nuevos eventos últimos 7 días.

**Endpoint:** `web/src/app/api/admin/stats/route.ts`
- Solo admins.
- Una sola query con agregaciones (`COUNT(*) FILTER (WHERE ...)`).

### Checkpoint Día 9 (final)
- [ ] Admin entra a `/admin` y ve métricas en tiempo real.
- [ ] Usuario no-admin que intenta acceder a `/admin` es redirigido.
- [ ] Sidebar de navegación admin funciona.

---

## DÍA 10 — Miércoles 6 de mayo
### Fase 7: Admin web — tablas de usuarios y eventos + cierre

### 10.1 — Página `/admin/users`
**Archivo nuevo:** `web/src/app/(admin)/admin/users/page.tsx`

Layout:
- Header con título y filtros: dropdown de rol + input de búsqueda.
- Tabla (shadcn `<Table>`) con columnas: Nombre / Email / Rol / Fecha registro / Estado.
- Paginación: 20 por página.
- Server component (RSC) con `searchParams` para filtros — es panel interno, no necesita SPA-like.

**Endpoint:** `web/src/app/api/admin/users/route.ts`
- Solo admins.
- Query params: `?role=&search=&page=&pageSize=`.

### 10.2 — Página `/admin/events`
**Archivo nuevo:** `web/src/app/(admin)/admin/events/page.tsx`

Layout:
- Filtros: status + tipo + rango de fechas.
- Tabla con columnas: Título / Cliente / Planner asignado / Status / Fecha del evento / Creado.
- Click en fila → modal con detalle (read-only).

**Endpoint:** `web/src/app/api/admin/events/route.ts`
- Solo admins.
- Mismos filtros vía query params.

### 10.3 — Acciones admin (alcance MVP)
- **Solo lectura** en MVP. No edición, no eliminación, no promover usuarios. Razón: cada acción de mutación requiere validación + auditoría que excede el deadline.
- **Excepción:** botón "Cambiar rol" para promover/degradar admin **solo si hay tiempo**. Si no, manual con `prisma studio`.

### 10.4 — Empty states y polish
- Si no hay usuarios/eventos → empty state con copy claro.
- Skeleton loaders en cargas.
- Mensajes de error si la API falla.

### Checkpoint Día 10
- [ ] Admin ve tabla completa de usuarios con filtros funcionando.
- [ ] Admin ve tabla de eventos con filtros funcionando.
- [ ] Sin sesión admin, todas las páginas `/admin/*` redirigen.
- [ ] Endpoints admin nunca devuelven datos a no-admins (verificado con request manual).

---

## DÍA 11 — Jueves 7 de mayo
### QA + Build de demo + Entrega

### 11.1 — Smoke test end-to-end (mañana)
Caminos a probar manualmente:

**Camino Cliente:**
1. Registro Cliente → verificación → dashboard → crear evento → asignar planner → publicar → ver tareas/presupuesto/proveedores → logout → login → ver evento persiste.

**Camino Planner:**
1. Registro Planner → dashboard ve evento asignado → abrir detalle → crear 3 tareas → cambiar status de una → agregar 5 items de presupuesto → asignar 2 vendors.

**Camino Vendor:**
1. Registro Vendor → dashboard ve invitación a evento → confirmar status.

**Camino Admin:**
1. Login con email admin → /admin → ver stats → ver usuarios filtrados por rol → ver eventos.

### 11.2 — Datos seed para demo
**Archivo:** `web/prisma/seed.ts` (extender)

Crear:
- 1 admin (tu email).
- 3 clientes con eventos en distintos estados.
- 2 planners (uno empresa, uno independiente).
- 5 vendors cubriendo categorías populares (catering, fotografía, música, decoración, salón).
- 1 evento "Boda demo" completamente armado: 1 cliente, 2 planners, 3 vendors, 8 tareas (mix de status), 12 items de presupuesto.

Comando: `npm run db:seed`.

### 11.3 — EAS Build (decisión #18)
- `npm install -g eas-cli && eas login`.
- `eas build:configure` (genera `eas.json`).
- Perfil `preview` con `distribution: "internal"`.
- `eas build --platform android --profile preview` → genera APK descargable por QR.
- (iOS requeriría cuenta de Apple Developer — para demo, usar Android es suficiente.)

### 11.4 — Polish final
- Verificar que no hay logs de debug en producción.
- Variables de entorno separadas (dev/prod).
- Splash screen con logo bonito si hay tiempo.
- Iconos de la app definitivos en `assets/`.

### 11.5 — Documentación de demo
**Archivo nuevo:** `DEMO.md` con:
- Cómo instalar el APK.
- Credenciales de los usuarios seed.
- Flujo recomendado de demostración paso a paso.
- QR del APK + link al admin web.

### Checkpoint Día 11
- [ ] APK funciona en device físico Android.
- [ ] Admin web accesible vía URL pública (Vercel).
- [ ] Datos seed cargados en BD productiva.
- [ ] Smoke test pasado para los 4 caminos.
- [ ] **MVP listo para ExpoSciencia.**

---

## Sección de Seguridad — Adiciones Días 5-10

| # | Control | Dónde se verifica |
|---|---|---|
| 17 | `POST /api/events` rechaza creación si rol ≠ CLIENT | Endpoint events |
| 18 | Asignación de planner requiere ser dueño del evento | Endpoint events/:id/planners |
| 19 | Transiciones de status validadas server-side por rol | Endpoint events/:id PATCH |
| 20 | Vendor NO ve presupuesto del evento (filter en GET) | Endpoint events/:id, budget |
| 21 | `GET /api/events/:id/tasks` filtra info confidencial si role=VENDOR | Endpoint tasks |
| 22 | Toda mutación en tareas/presupuesto/vendors verifica autorización por rol | Endpoints respectivos |
| 23 | Middleware de `/admin/*` valida `User.role === ADMIN` con query a Postgres | `middleware.ts` |
| 24 | Endpoints `/api/admin/*` doble-verifican rol (defense in depth) | Cada endpoint admin |
| 25 | Admin web nunca devuelve `clerkId`, `password hash`, ni tokens | Sanitización en queries |
| 26 | Logs de admin NO incluyen RFC, razón social, ni datos fiscales | Logger global |
| 27 | EAS Build con env vars de producción separadas de dev | `eas.json` con perfiles |
| 28 | APK firmado con keystore propio (no debug) | `eas.json` perfil preview |
| 29 | Rate limiting en `/api/events` (POST) — máx 10 eventos/hora por usuario | Post-MVP, anotar TODO |
| 30 | Auditoría de acciones admin | Post-MVP, anotar TODO |

---

## Riesgos y Contingencias

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| EAS Build falla por config | Alta | Tener Expo Go como plan B aceptando limitaciones; verificar build el Día 10 por la noche, no dejar para el 7 |
| Demo en stand sin internet | Media | App + admin web requieren red. Plan B: hotspot de celular. Plan C: video grabado de la demo como respaldo |
| Categorías de presupuesto no calzan con casos reales | Media | Lista cerrada permite "Otros" como escape hatch |
| Planner intenta editar evento que no le asignaron | Media | Autorización server-side ya cubre; validar con tests manuales |
| Admin web con 1000+ usuarios paginación rota | Baja | Paginación implementada desde Día 10; si crece, mover a server-side filtering ya está hecho |
| Tab Material funciona mal en Android viejo | Baja | Probar en device físico; alternativa: segmented control simple |
| Datos seed no se cargan en prod (Neon) | Media | Probar seed con `DATABASE_URL` de prod en una rama de prueba antes del Día 11 |

---

## Lo que NO se hace en estas Fases

- ❌ Chat en tiempo real (post-MVP)
- ❌ Notificaciones push (post-MVP)
- ❌ Subida de documentos al evento (`Document` model existe en schema pero no se construye UI)
- ❌ Calificación / rating de planners y vendors (post-MVP)
- ❌ Equipo del planner (`PlannerTeamMember` — schema existe, UI no)
- ❌ Catálogo público de `VendorService` con búsqueda (solo vinculación en evento)
- ❌ Edición de eventos completa (solo cambio de status; resto de campos no editables en MVP)
- ❌ Forgot password / cambio de password
- ❌ Pagos / pasarelas
- ❌ Internacionalización (es-MX hardcoded)
- ❌ Modo oscuro
- ❌ Testing automatizado (E2E con Detox queda post-MVP)
- ❌ Auditoría de acciones admin
- ❌ Rate limiting en endpoints
- ❌ Soft deletes en BD (todo es hard delete, no hay papelera)

---

## Resumen visual de los 7 días

```
MAYO
01  02  03  04  05  06  07
─────────────────────────────
[5][6]                       → Fase 3: Eventos (CRUD + asignación + status)
     [7]                     → Fase 4: Tareas
        [8]                  → Fase 5: Presupuesto
           [9]               → Fase 6: Proveedores (mañana) + Fase 7 setup (tarde)
              [10]           → Fase 7: Admin web (tablas + polish)
                  [11]       → QA + EAS Build + Demo
                  🚀 ExpoSciencia
```

---

## Decisiones que necesito antes de arrancar el Día 5

Cuando lleguemos al Día 5, te voy a pedir confirmar las decisiones #9-19 de este documento. Si quieres adelantarlas ahora, mejor — te ahorro otra ronda de preguntas.

---

*Plan crítico Días 5–11 · PlannerApp · ExpoSciencia Mayo 2026*
