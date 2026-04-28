# Plan de Implementación — Días 1 a 4 (Fases 1 y 2)

> Documento de trabajo. Plan crítico, accionable y con archivos exactos para los días 27 al 30 de abril 2026.

---

## Auditoría del Estado Real (no del roadmap)

El roadmap pinta un panorama más optimista que la realidad del código. Antes de codear, esto es lo que realmente está roto o falta:

### Lo que el roadmap dice "completado" pero NO está bien

| Área | Realidad |
|---|---|
| **EmailVerification** | Es un **placeholder** literal con texto "Verificación de correo". No llama a `signUp.attemptEmailAddressVerification`, no recibe params, no completa el signup. **El flujo de registro no termina hoy.** |
| **El rol del usuario** | Se selecciona en `RegisterScreen` y **se pierde**. No se pasa como param, no se guarda en `unsafeMetadata` de Clerk, no se persiste. La única forma de saber el rol al final es por inferencia de qué pantalla precedió a `EmailVerification`. |
| **Datos del onboarding** | Viven solo en `route.params`. Si el usuario cambia de app, hace pull-to-refresh, o pierde foco, se evaporan. No hay store. |
| **`RegisterPlannerStep3`** | El botón "Continuar" tiene esto: `// navigation.navigate('RegisterPlannerStep4', ...)`. Está **comentado**. Es un dead-end. |
| **`RegisterPlannerStep4`** | **No existe.** El flujo del planner no tiene paso de email/password ni llamada a Clerk `signUp.create`. |
| **Backend `/web`** | Es la plantilla por defecto de `create-next-app`. Sin API routes, sin middleware Clerk, sin `lib/prisma.ts`, sin nada. La Fase 2 del roadmap asume que existe. |
| **Storage de imágenes del portfolio** | El planner sube hasta 10 imágenes en Step3 — antes de tener `userId`. No hay Cloudinary, S3, ni Supabase Storage configurado. **Las imágenes hoy no van a ningún lado.** |
| **Lógica de "sesión activa"** | Si el usuario ya está autenticado y abre la app, igual aterriza en `Login`. No hay redirect según `useAuth().isSignedIn`. La Fase 2 lo da por hecho. |

### Banderas rojas adicionales

- `@supabase/supabase-js` instalado en `/PlannerApp` — se mantiene para Storage (decisión confirmada).
- OAuth Google/Apple cableados en `LoginScreen` pero requieren scheme custom en `app.json` y config en Clerk dashboard. **Se ocultan en Fase 1** para no perder tiempo.
- No hay `Role: ADMIN` flujo: se resuelve con whitelist de emails en env var.

---

## Decisiones Confirmadas

| # | Decisión | Resolución |
|---|---|---|
| 1 | Dónde vive el rol durante onboarding | **A** — `unsafeMetadata` de Clerk |
| 2 | Cuándo se crea el `User` + perfil en BD | **A** — Webhook crea `User` base; app llama `POST /api/users/me/profile` con el resto |
| 3 | Storage de imágenes del portfolio | **C** — Supabase Storage |
| 4 | Validación de RFC | **A** — Solo formato básico (longitud + alfanumérico) |
| 5 | Vendor — categorías pre-seedeadas | 14 categorías de bodas (lista abajo); `VendorService` en post-login |
| 6 | Asignación de admin | **A** — Whitelist en env var `ADMIN_EMAILS` |
| 7 | OAuth Google/Apple | Ocultos en Fase 1 — TODO post-MVP |
| 8 | `@supabase/supabase-js` en mobile | Se queda — para Storage |

### Categorías pre-seedeadas (bodas México) — pendiente confirmación final

1. Banquetes y Catering
2. Fotografía
3. Video / Videografía
4. Música y DJ
5. Decoración y Flores
6. Salones, Jardines y Venues
7. Pastelería y Postres
8. Bar y Bebidas
9. Mobiliario y Renta
10. Maquillaje y Estilismo
11. Invitaciones y Papelería
12. Animación y Entretenimiento
13. Transporte
14. Iluminación y Audio

### Pendiente de confirmación

- **Subida de portfolio** — ¿directa desde mobile (más rápido) o vía backend (más seguro, +30 min)?
  - **→ Recomendación: backend.** Mantiene `SUPABASE_SERVICE_ROLE_KEY` solo en server, valida tipo y tamaño antes de subir, y simplifica RLS.

---

## Prerrequisitos (configurar antes del Día 1)

Estos no son tareas de código. Si no están listos, el Día 2 truena.

| # | Acción | Quién | Notas |
|---|---|---|---|
| 1 | Verificar conexión a Neon: `cd web && npx prisma db push` | Tú | Confirma que `DATABASE_URL` está en `web/.env` |
| 2 | Crear bucket en Supabase Storage llamado `portfolio` (público o con signed URLs) | Tú | Anota `SUPABASE_URL` y `SUPABASE_ANON_KEY` |
| 3 | En Clerk Dashboard → Webhooks: crear endpoint apuntando a `https://<tu-tunnel>/api/webhooks/clerk` con event `user.created`, copiar `Signing Secret` | Tú | Para dev usa `ngrok` o `cloudflared` |
| 4 | Definir tu lista de emails admin (1-2 emails) | Tú | Va a `ADMIN_EMAILS` env var |
| 5 | Confirmar que `npm install svix zod` corre en `/web` | Lo ejecuto yo | Necesarias para webhook + validación |

### Variables de entorno requeridas

**`/web/.env`**
```
DATABASE_URL=postgres://...neon...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
ADMIN_EMAILS=carlossmg13@gmail.com
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # SOLO en server, nunca en mobile
```

**`/PlannerApp/.env`** (Expo lee variables con prefijo `EXPO_PUBLIC_`)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000   # IP local para dev en device físico
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon key, NO service role
```

---

## DÍA 1 — Lunes 27 de abril
### Cerrar el flujo de registro completo de los 3 roles + EmailVerification real

Orden estricto. Si algo no compila, paro y aviso.

### 1.1 — Refactor de tipos de navegación
**Archivo:** `PlannerApp/src/navigation/types.ts`

- Cambiar todos los `RegisterClientStepN` y `RegisterPlannerStepN` para que **NO lleven los datos del onboarding como params** (están a punto de migrar a `unsafeMetadata`).
- Agregar `RegisterVendorStep2`, `RegisterVendorStep3`, `RegisterPlannerStep4`.
- Agregar el stack post-login: `Main` (será un nested navigator).
- `EmailVerification` ya no necesita params — el rol y el draft viven en Clerk metadata.

### 1.2 — Hook centralizado para draft del onboarding
**Archivo nuevo:** `PlannerApp/src/hooks/useOnboardingDraft.ts`

- Wrapper sobre `useSignUp` que expone helpers:
  - `setRole(role)` — guarda en state local.
  - `mergeDraft(partial)` — acumula campos del onboarding.
  - `submitSignUp({ email, password })` — llama a `signUp.create({ ..., unsafeMetadata: { role, profile: draft } })` y luego `prepareEmailAddressVerification`.
- **Por qué un hook y no un store:** durante el signup, antes de `setActive`, NO hay `userId`. `unsafeMetadata` se persiste **dentro del propio objeto signUp de Clerk**, que sí sobrevive entre pantallas mientras el flujo no termine.
- **Crítico de seguridad:** `unsafeMetadata` es **escribible desde el cliente** (de ahí el nombre). No confiar en él server-side para autorización. Usado solo como vehículo de transporte para que el webhook + endpoint de profile lean qué crear.

### 1.3 — Pantallas de Vendor (nuevas)
**Archivos nuevos:**
- `PlannerApp/src/app/auth/RegisterVendorStep2.tsx` — categoría (dropdown con las 14 pre-seedeadas), business name, bio corta.
- `PlannerApp/src/app/auth/RegisterVendorStep3.tsx` — datos fiscales (RFC opcional, razón social, régimen) + credenciales (email, password, confirm) + términos. Misma estructura visual que `RegisterClientStep4`.

**Decisión de diseño UX:**
- El Vendor **no tiene Step1 propio**: su Step1 es la `RegisterScreen` (selección de rol). Numero los pasos como "Paso 2 de 3" / "Paso 3 de 3" en el footer y `StepProgress steps={3}`. Los flujos son distintos por rol — no fuerces 4 pasos en todos.

### 1.4 — Crear `RegisterPlannerStep4.tsx`
**Archivo nuevo.**

- Espejo del `RegisterClientStep4` (credenciales + facturación + términos), pero también incluye **subida de portfolio diferida**: en este paso solo guardamos las URIs locales en el draft. La subida real a Supabase Storage se hace **después** de obtener `userId`, cuando se llama a `POST /api/users/me/profile`.
- Razón: no podemos subir antes del signup porque Supabase necesitaría que sea un bucket público sin auth (riesgo) o que tengamos el userId.

### 1.5 — Conectar `RegisterPlannerStep3` (descomentar el dead-end)
**Archivo:** `PlannerApp/src/app/auth/RegisterPlannerStep3.tsx`

- Cambiar `handleContinue` para navegar a `RegisterPlannerStep4` y mergear los datos al draft.
- `StepProgress` sigue siendo `steps={4} current={3}` para planner.

### 1.6 — `RegisterScreen` ahora persiste rol al draft
**Archivo:** `PlannerApp/src/app/auth/RegisterScreen.tsx`

- Habilitar la rama Vendor (hoy está deshabilitada en `handleContinue`).
- Llamar `setRole(selectedRole)` antes de navegar al Step2 correspondiente.

### 1.7 — Reescribir `EmailVerification.tsx` desde cero
**Archivo:** `PlannerApp/src/app/auth/EmailVerification.tsx`

Pieza crítica. Hoy es placeholder.

Funcionalidad:
- Input de 6 dígitos (uso `AppInput` con `keyboardType="number-pad"`, `maxLength={6}`).
- Botón "Verificar" → `signUp.attemptEmailAddressVerification({ code })`.
- Si éxito → `setActive({ session: createdSessionId })` → navegar a `Main` (que cargará el dashboard correcto según rol).
- "Reenviar código" con cooldown de 30s (timer visible).
- Manejo de errores: código incorrecto, código expirado, email ya verificado.
- Diseño: header con icono mail, copy "Te enviamos un código a tu@email.com", input grande centrado, botón primary, link de reenvío.

**UX critical:**
- Auto-submit cuando llegan los 6 dígitos.
- Mostrar el email enmascarado (`u***o@gmail.com`) — buena práctica de seguridad y feedback al usuario sobre qué cuenta está verificando.
- Soporto `textContentType="oneTimeCode"` en iOS para sugerencia desde el teclado.

**Después de la verificación:** la pantalla **NO** llama a `POST /api/users/me/profile`. ¿Por qué? Porque:
1. El webhook ya creó el `User` base con `clerkId`.
2. Llamar al endpoint inmediatamente acopla la pantalla de verificación a la lógica de perfil.

En cambio, `EmailVerification` solo `setActive` y deja que el primer screen del `MainNavigator` detecte "User existe pero `ClientProfile`/`PlannerProfile`/`VendorProfile` es null" y dispare la creación del perfil. **Esto se hace en Día 3, no en Día 1.**

### 1.8 — Actualizar `RootNavigator.tsx`
**Archivo:** `PlannerApp/src/navigation/RootNavigator.tsx`

- Registrar `RegisterVendorStep2`, `RegisterVendorStep3`, `RegisterPlannerStep4`.
- Pre-pisar el placeholder `Main` que solo dirá "Dashboard placeholder" hoy. La división Auth/App stack viene en Día 3.

### 1.9 — Quitar OAuth de Login
**Archivo:** `PlannerApp/src/app/auth/LoginScreen.tsx`

- Comentar o eliminar `socialRow` y los handlers OAuth.
- También el divider "O CONTINUAR CON".
- Anotar `// TODO post-MVP: rehabilitar OAuth Google/Apple cuando los providers estén configurados en Clerk dashboard`.

### 1.10 — Cliente Supabase para mobile
**Archivo nuevo:** `PlannerApp/src/lib/supabase.ts`

```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } } // Clerk maneja la auth, no Supabase
);
```

### Checkpoint Día 1
- [ ] Los 3 flujos de registro arrancan desde `RegisterScreen` y llegan a `EmailVerification` sin pantallas en blanco ni dead-ends.
- [ ] `EmailVerification` verifica el código, hace `setActive`, y navega a un placeholder de `Main`.
- [ ] El usuario aparece en Clerk Dashboard con `unsafeMetadata.role` y `unsafeMetadata.profile` correctos.
- [ ] No hay nada de OAuth visible en Login.

---

## DÍA 2 — Martes 28 de abril
### Backend mínimo viable + sincronización con BD

Día crítico de seguridad. Aquí cualquier descuido se vuelve agujero.

### 2.1 — Setup de Next.js para producción
**Archivos nuevos en `/web`:**

- `src/lib/prisma.ts` — Prisma client singleton con Neon adapter (HMR-safe).
- `src/lib/clerk.ts` — helper `getCurrentUser()` que combina `auth()` de Clerk + lookup en `User` por `clerkId`. Lanza `unauthorized()` si no hay sesión o si no existe el `User`.
- `src/lib/supabaseAdmin.ts` — cliente Supabase con `SERVICE_ROLE_KEY` (solo server-side).
- `src/lib/validation.ts` — schemas Zod compartidos para profiles (Client, Planner, Vendor).
- `src/lib/responses.ts` — helpers `ok()`, `badRequest()`, `unauthorized()`, `serverError()` que devuelven `NextResponse` consistentes.
- `src/middleware.ts` — middleware de Clerk Next.js, **excepto** `/api/webhooks/clerk` que es público.
- `src/app/layout.tsx` — wrap con `<ClerkProvider>`.

### 2.2 — Webhook de Clerk — endpoint crítico
**Archivo:** `web/src/app/api/webhooks/clerk/route.ts`

Implementación robusta no negociable:

1. **Verificación de firma con `svix`** — leer `svix-id`, `svix-timestamp`, `svix-signature`. Si la firma falla → 401. Sin esto, cualquiera te crea usuarios.
2. **Idempotencia** — si llega `user.created` dos veces (Clerk reintenta), no crear dos `User`. Uso `prisma.user.upsert` por `clerkId`.
3. **Validación de payload con Zod** — no confiar en la estructura de Clerk.
4. **Asignación de rol**:
   - Leer `unsafeMetadata.role` del payload.
   - Si email está en `ADMIN_EMAILS` (env), forzar `role = ADMIN` ignorando lo que diga el cliente.
   - Si `role` no es válido (`CLIENT|PLANNER|VENDOR|ADMIN`) → log + 400.
5. **NO crea perfil aún** — solo `User`. El perfil se crea desde la app vía endpoint dedicado.
6. **Logging estructurado** — loguea `clerkId`, evento, resultado. Nunca loguees emails completos en producción (PII).
7. **Responde 200 rápido** — Clerk reintenta si tarda >10s.

### 2.3 — Endpoint de creación de perfil (autenticado)
**Archivo:** `web/src/app/api/users/me/profile/route.ts` (POST)

- Auth: `auth().userId` obligatorio. Si no hay → 401.
- Buscar `User` por `clerkId`. Si no existe → 404 (esperar webhook).
- Validar body con Zod `discriminatedUnion` por `role`:
  ```ts
  z.discriminatedUnion("role", [
    z.object({ role: z.literal("CLIENT"), preferredCity: z.string(), ... }),
    z.object({ role: z.literal("PLANNER"), identityType: z.enum([...]), ... }),
    z.object({ role: z.literal("VENDOR"), categoryId: z.string().cuid(), ... }),
  ])
  ```
- **Verificar que el `role` del body coincide con `User.role`** — si no, 403.
- Si ya existe el perfil para ese rol → `update`, no `create` (idempotencia frente a reintentos del cliente).
- Validación RFC básica: `/^[A-Z0-9Ñ&]{12,13}$/i.test(rfc)` si viene presente.
- **Para Planner**: si vienen `portfolioUrls` (URLs de Supabase Storage ya subidas), las guarda. Si vienen `portfolioFiles` (base64 o URIs locales) → 400, "subir antes a Storage".

### 2.4 — Endpoint `GET /api/users/me`
**Archivo:** `web/src/app/api/users/me/route.ts`

- Devuelve `{ user, profile }` donde `profile` es el del rol correspondiente o `null` si todavía no se creó.
- La app lo usa en Día 3 para decidir: si `profile === null`, mandar al usuario a un screen "Completar perfil" que dispara `POST /api/users/me/profile`. Si existe, ir al dashboard.

### 2.5 — Endpoint público `GET /api/vendor-categories`
**Archivo:** `web/src/app/api/vendor-categories/route.ts`

- Devuelve la lista de `VendorCategory`. Sin auth (la app la consume durante el registro de vendor, antes de tener sesión).
- Cache: `next: { revalidate: 3600 }` — son datos casi estáticos.

### 2.6 — Seed de `VendorCategory`
**Archivo nuevo:** `web/prisma/seed.ts` + script en `package.json`.

- Inserta las 14 categorías (idempotente con `upsert` por `name`).
- Comando: `npx prisma db seed`.

### 2.7 — Cliente HTTP en mobile con Clerk JWT
**Archivo nuevo:** `PlannerApp/src/lib/api.ts`

- Función `apiFetch<T>(path, options)` que:
  - Llama `useAuth().getToken()` antes de cada request (los tokens de Clerk expiran a los 60s — siempre regenerar).
  - Inyecta `Authorization: Bearer <token>`.
  - Maneja 401 → fuerza logout (`signOut`).
  - Tipa la respuesta con generics.
- **No usar Axios** — `fetch` nativo es suficiente y reduce bundle.

### 2.8 — Sub de portfolio a Supabase Storage (vía backend)
**Archivos nuevos:**
- `web/src/app/api/users/me/portfolio/upload/route.ts` — recibe `multipart/form-data`, valida tipo (image/*), tamaño (<5MB), sube con service role a `portfolio/{userId}/{filename}`, devuelve URL pública.
- `PlannerApp/src/lib/uploadPortfolio.ts` — `uploadPortfolio(uris: string[]): Promise<string[]>` que llama al endpoint anterior con `FormData`.
- Llamado desde `CompleteProfileScreen` en Día 3, **no** durante el registro.

**Seguridad:**
- Tipo MIME validado server-side (no confiar en el header del cliente).
- Tamaño máximo en bytes, hard limit.
- Nombre de archivo se regenera con `crypto.randomUUID()` para evitar path traversal y colisiones.
- Bucket policy: lectura pública OK; escritura **solo desde server** con service role.

### Checkpoint Día 2
- [ ] Webhook de Clerk recibe eventos y crea `User` en Postgres con rol correcto.
- [ ] Email admin definido aparece con `Role: ADMIN`.
- [ ] App, tras `EmailVerification`, llama al endpoint de profile y se crea `ClientProfile`/`PlannerProfile`/`VendorProfile` correcto.
- [ ] `GET /api/users/me` devuelve user + profile.
- [ ] Las 14 categorías están en BD y la app las lee.

---

## DÍA 3 — Miércoles 29 de abril
### Auth gating + Dashboards Cliente y Planner

### 3.1 — Split Auth/App en RootNavigator
**Archivo:** `PlannerApp/src/navigation/RootNavigator.tsx`

```
<NavigationContainer>
  {!isLoaded ? <SplashScreen /> :
   !isSignedIn ? <AuthStack /> :
   <AppStack />}
</NavigationContainer>
```

- Crear `SplashScreen` simple con logo + spinner (Moti opacity loop).
- `AuthStack` = el actual flujo de Login/Register.
- `AppStack` = el `MainNavigator` (Bottom Tabs).

### 3.2 — Hook `useCurrentUser`
**Archivo nuevo:** `PlannerApp/src/hooks/useCurrentUser.ts`

- Internamente: `useAuth()` + `useState` con resultado de `GET /api/users/me`.
- Cachea el resultado en memoria (refetch on mount).
- Expone `{ user, profile, role, isLoading, refetch }`.
- Si `profile === null` y `User` ya existe, muestra al MainNavigator que tiene que mostrar `CompleteProfileScreen` (un screen que dispara el `POST /api/users/me/profile` con los datos del `unsafeMetadata`).

### 3.3 — `MainNavigator` con tabs por rol
**Archivo nuevo:** `PlannerApp/src/navigation/MainNavigator.tsx`

Tabs distintos por rol — no fuerces los mismos a todos:

| Rol | Tabs |
|---|---|
| CLIENT | Dashboard · Eventos · Perfil |
| PLANNER | Dashboard · Eventos · Equipo · Perfil |
| VENDOR | Dashboard · Servicios · Perfil |

Día 3 solo implemento Dashboard + Perfil placeholder. Eventos viene en Día 4 / Fase 3.

**Diseño visual de Bottom Tabs:**
- Custom tab bar con altura ~64pt + safe area.
- Iconos `Ionicons` filled cuando seleccionado, outline cuando no.
- Color primary (`#10b981`) en activo, `textMuted` (`#6b7280`) en inactivo.
- Sin labels para iconografía limpia, o labels muy sutiles (12pt, weight 600).

### 3.4 — `ClientDashboardScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/client/ClientDashboardScreen.tsx`

Vista (placeholder de datos hasta Día 4):
- Header: "Hola, {firstName} 👋" + avatar/iniciales a la derecha.
- Card "hero": "¿Listo para crear tu próximo evento?" + botón primary "Crear evento".
- Sección "Mis eventos" con `FlatList` horizontal de event cards (vacía con empty state hoy, "Aún no tienes eventos. Crea el primero.").
- Sección "Próximas tareas" placeholder.

**Empty state:**
- Ilustración simple (puedes usar emoji + tipografía: "✨ Tu primer evento te espera").
- Sin assets pesados — el deadline no permite contratar ilustraciones.

### 3.5 — `PlannerDashboardScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/planner/PlannerDashboardScreen.tsx`

Vista:
- Header similar.
- KPIs en grid 2×2: "Eventos activos" / "Tareas pendientes" / "Próximo evento (fecha)" / "Equipo".
- Lista de eventos asignados con status visible (DRAFT / ACTIVE / IN_PROGRESS).
- Empty state: "Aún no te han asignado eventos."

### 3.6 — `CompleteProfileScreen` (cierra el ciclo del Día 2)
**Archivo nuevo:** `PlannerApp/src/app/auth/CompleteProfileScreen.tsx`

- Si llega aquí, significa que el `User` existe pero el perfil no.
- Lee `user.unsafeMetadata` de Clerk, dispara automáticamente `POST /api/users/me/profile`.
- Si rol = PLANNER y hay portfolio en draft → primero dispara upload a Storage, luego envía las URLs en el profile.
- Muestra "Configurando tu cuenta..." con loader.
- Al terminar: `refetch` del `useCurrentUser` y MainNavigator monta el dashboard correcto.
- Si falla, ofrece reintentar.

### Checkpoint Día 3
- [ ] App detecta sesión activa al abrir y va directo a dashboard.
- [ ] Cada rol ve sus propios tabs.
- [ ] Cliente ve `ClientDashboardScreen`, Planner ve `PlannerDashboardScreen`.
- [ ] Tras registro fresco, el flujo continuo es: EmailVerification → CompleteProfileScreen → Dashboard.

---

## DÍA 4 — Jueves 30 de abril
### Vendor dashboard + APIs de eventos

### 4.1 — `VendorDashboardScreen`
**Archivo nuevo:** `PlannerApp/src/app/main/vendor/VendorDashboardScreen.tsx`

Vista:
- Header.
- Card "Mi negocio" con `businessName`, categoría, rating (placeholder).
- Sección "Eventos donde participo" — lista de `EventVendor` donde el vendor está asignado, con status (PENDING / CONFIRMED / CANCELLED).
- Sección "Mis servicios" placeholder + CTA "Agregar servicio" (que se construye en Fase 6, post-MVP).

### 4.2 — API `GET /api/events` con autorización por rol
**Archivo:** `web/src/app/api/events/route.ts`

Lógica de filtrado **server-side** (jamás cliente):
- `CLIENT` → `prisma.event.findMany({ where: { client: { userId: currentUser.id } } })`
- `PLANNER` → eventos donde `EventPlanner.plannerId === currentUser.plannerProfile.id`
- `VENDOR` → eventos donde `EventVendor.vendorId === currentUser.vendorProfile.id`
- `ADMIN` → todos los eventos
- Paginación: `?cursor=...&limit=20`. Default limit 20, max 50.
- Response: `{ events: Event[], nextCursor: string | null }`.

### 4.3 — API `GET /api/events/:id`
**Archivo:** `web/src/app/api/events/[id]/route.ts`

- Obtener el evento con relaciones (planners, vendors, tasks count, budget total).
- **Verificar autorización**: el current user debe ser dueño (CLIENT), planner asignado, vendor asignado, o ADMIN. Si no → 403, no 404 (no exponer existencia).
- Siempre incluir `_count` de tareas y budget items en lugar de cargar todas las relaciones.

### 4.4 — Hook `useEvents`
**Archivo nuevo:** `PlannerApp/src/hooks/useEvents.ts`

- Encapsula `apiFetch('/api/events')`.
- Manejo de loading/error/data.
- `refetch()` para pull-to-refresh.

### 4.5 — Conectar dashboards con datos reales
- `ClientDashboardScreen` consume `useEvents()`, muestra los eventos del cliente.
- `PlannerDashboardScreen` igual + KPIs derivados de la lista.
- `VendorDashboardScreen` igual.
- Pull-to-refresh en cada dashboard.

### 4.6 — Components nuevos en design system
**Archivos nuevos:**
- `PlannerApp/src/components/ui/EventCard.tsx` — card reutilizable para evento (título, fecha, status badge, lugar).
- `PlannerApp/src/components/ui/StatusBadge.tsx` — badge de color según `EventStatus` / `VendorStatus` / `TaskStatus`.
- `PlannerApp/src/components/ui/EmptyState.tsx` — empty state genérico (icono + título + subtítulo + CTA opcional).

### Checkpoint Día 4
- [ ] Cada rol ve sus eventos reales (creados manualmente con `prisma studio` para testing).
- [ ] Empty states funcionan cuando no hay eventos.
- [ ] Pull-to-refresh actualiza la lista.
- [ ] Llamar `GET /api/events/:id` con un evento ajeno devuelve 403.

---

## Sección de Seguridad — checklist no negociable

| # | Control | Dónde se verifica |
|---|---|---|
| 1 | Webhook de Clerk verifica firma `svix` antes de tocar BD | `route.ts` del webhook |
| 2 | `ADMIN_EMAILS` se aplica server-side, no se acepta desde cliente | Webhook Clerk |
| 3 | Endpoint `/api/users/me/profile` valida que `body.role === user.role` | Endpoint profile |
| 4 | Todos los endpoints (excepto webhook + categories) requieren `auth().userId` | Middleware Clerk |
| 5 | Validación con Zod en cada body, sin pasar nada raw al ORM | Cada API route |
| 6 | RFC y datos fiscales: nunca loguearlos | Logger global |
| 7 | Errores: nunca exponer stack trace al cliente en prod | Helper `serverError()` |
| 8 | `Authorization` se obtiene con `getToken()` por request (token expira en 60s) | `apiFetch` |
| 9 | `SUPABASE_SERVICE_ROLE_KEY` solo en `/web`, jamás en mobile | env vars |
| 10 | Subida de portfolio vía backend, no directo desde mobile | `/api/users/me/portfolio/upload` |
| 11 | Validación de `Content-Type` y tamaño en upload (<5MB, image/*) | Endpoint upload |
| 12 | `unsafeMetadata` no se usa para autorización server-side | Webhook + endpoints |
| 13 | Idempotencia en webhook (`upsert` por `clerkId`) | Webhook |
| 14 | `Event` GET por id devuelve 403 si no autorizado, no 404 | Endpoint |
| 15 | Prisma client singleton para evitar exhaustion de conexiones en serverless | `lib/prisma.ts` |
| 16 | Rate limiting en endpoints públicos (categories) | Post-MVP, anotar como TODO |

---

## Riesgos y contingencias

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Webhook Clerk no llega en dev (firewall/tunnel) | Alta | Tener `ngrok`/`cloudflared` listo, o feature flag para crear `User` desde el endpoint de profile como fallback |
| `unsafeMetadata` se pierde en background del app | Media | El draft también vive en el hook `useOnboardingDraft`. Si Clerk pierde el signUp, el usuario reintenta — no es destructivo |
| Supabase Storage upload tarda mucho | Media | UX: spinner con progreso + opción "subir más tarde" en CompleteProfile |
| Token Clerk expira mid-request | Baja | `apiFetch` ya regenera por request |
| Schema Prisma cambia y rompe webhook | Baja | Migraciones se aplican en dev antes; en prod son atómicas |

---

## Lo que NO se hace en estas 2 fases

Para que quede explícito y no haya scope creep:

- ❌ Pantallas de "Eventos" tab (eso es Fase 3)
- ❌ Crear/editar eventos
- ❌ Tareas, presupuesto, proveedores en eventos
- ❌ Pantalla de "Equipo" del planner
- ❌ "Servicios" del vendor
- ❌ OAuth Google/Apple
- ❌ Admin web (eso es Fase 7)
- ❌ Forgot password (lo dejamos como link "próximamente")
- ❌ Push notifications

---

*Plan crítico Días 1–4 · PlannerApp · ExpoSciencia Mayo 2026*
