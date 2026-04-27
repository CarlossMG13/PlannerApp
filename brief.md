# PlannerApp — Brief para ExpoSciencia

> Documento de presentación del proyecto para deck en Canva / Claude Design.

---

## 1. ¿Qué es PlannerApp?

**PlannerApp** es una plataforma móvil diseñada para **centralizar y simplificar la organización de eventos en México**. Conecta a tres actores clave del ecosistema de eventos: el cliente que organiza su propio evento, el planner profesional que lo gestiona, y el proveedor que ofrece servicios especializados.

---

## 2. La Problemática

Organizar un evento en México — una boda, un evento corporativo, un cumpleaños de gran escala — implica coordinación entre decenas de partes: salones, catering, fotografía, música, decoración, papelería legal, presupuestos, tareas pendientes y equipos de personas.

**Hoy, este proceso se gestiona con:**

- Hojas de cálculo de Excel dispersas
- Grupos de WhatsApp sin estructura
- Correos electrónicos sin seguimiento
- Notas en papel o apps genéricas no especializadas
- Sin visibilidad centralizada del presupuesto ni del avance

**Consecuencias:**

- Errores de comunicación entre planner, cliente y proveedores
- Sobrecostos por falta de seguimiento del presupuesto
- Tareas críticas que se pierden o duplican
- Proveedores confirmados sin contrato digital
- Clientes sin visibilidad real del estado de su evento

---

## 3. La Solución

PlannerApp unifica todo en un solo ecosistema digital:

| Componente        | Descripción                                       |
| ----------------- | ------------------------------------------------- |
| **App Móvil**     | React Native (Expo) — iOS y Android               |
| **Backend Web**   | Next.js + API REST con Prisma ORM                 |
| **Base de Datos** | PostgreSQL con esquema relacional robusto         |
| **Autenticación** | Clerk — segura, con verificación de email y roles |

---

## 4. Los Tres Roles

### Cliente

Persona que organiza su propio evento (boda, fiesta, reunión corporativa).

- Crea y administra su evento
- Ve el presupuesto en tiempo real
- Consulta el avance de tareas
- Se comunica con su planner asignado

### Planner

Profesional o empresa que gestiona eventos para terceros.

- Puede ser independiente o empresa con equipo
- Administra múltiples eventos simultáneos
- Asigna tareas a su equipo
- Coordina y contrata proveedores
- Gestiona documentos y contratos

### Proveedor

Negocio o freelancer que ofrece servicios para eventos.

- Catering, fotografía, música, decoración, etc.
- Catálogo de servicios con precios en MXN
- Confirmación de contratación por evento
- Historial de participación y calificación

---

## 5. Flujo Completo de la App

### Onboarding y Registro (4 pasos por rol)

```
Pantalla de Login / Registro
        │
        ▼
Paso 1: Selección de Rol
   ┌────────────────────────────────┐
   │  Cliente  │  Planner  │  Proveedor  │
   └────────────────────────────────┘
        │
        ▼ (según rol)
Paso 2: Información personal
   • Cliente:   nombre, ciudad, rango de invitados
   • Planner:   tipo (empresa/independiente), especialidades
   • Proveedor: categoría de servicio, nombre del negocio

Paso 3: Datos del negocio / fiscales
   • RFC, Razón Social, Régimen Fiscal (facturación MX)
   • Ciudades de cobertura (planners)
   • Portafolio y rango de presupuesto

Paso 4: Verificación de Email (Clerk)
        │
        ▼
Dashboard principal (según rol)
```

### Ciclo de Vida de un Evento

```
Cliente crea evento
        │
        ├── Asigna planner → EventPlanner (isLead)
        │
        ├── Planner gestiona:
        │       ├── Tareas (TODO → IN_PROGRESS → DONE)
        │       ├── Presupuesto (ESTIMATED → CONFIRMED → PAID)
        │       ├── Documentos (contratos, imágenes, propuestas)
        │       └── Proveedores (PENDING → CONFIRMED → CANCELLED)
        │
        └── Estado del evento:
              DRAFT → ACTIVE → IN_PROGRESS → COMPLETED
                                           └─ CANCELLED
```

---

## 6. Módulos Clave

### Gestión de Eventos

- Tipos: Boda, Corporativo, Cumpleaños, Social, Otro
- Fecha, lugar, aforo estimado
- Presupuesto total en MXN
- Estado en tiempo real

### Gestión de Tareas

- Kanban por evento: TODO / IN_PROGRESS / DONE
- Prioridad: BAJA / MEDIA / ALTA
- Asignación a miembro del equipo
- Fechas de vencimiento

### Control de Presupuesto

- Ítems por categoría (Catering, Decoración, Música, etc.)
- Monto estimado vs. monto real
- Estados: Estimado → Confirmado → Pagado
- Visibilidad total del gasto vs. presupuesto

### Gestión de Proveedores

- Catálogo de servicios con precio base en MXN
- Vinculación al evento con precio acordado
- Seguimiento del estatus de contratación
- Notas y observaciones por proveedor

### Documentos Digitales

- Subida de contratos, propuestas, imágenes
- Asociados al evento y al usuario que los cargó
- Tipo de documento: contrato, imagen, propuesta, etc.

---

## 7. Stack Tecnológico

| Capa          | Tecnología                        |
| ------------- | --------------------------------- |
| Mobile        | React Native + Expo               |
| Animaciones   | Moti (Reanimated)                 |
| Navegación    | React Navigation (Native Stack)   |
| Backend       | Next.js (API Routes)              |
| ORM           | Prisma                            |
| Base de datos | PostgreSQL                        |
| Autenticación | Clerk                             |
| Lenguaje      | TypeScript (full-stack)           |
| Estilo        | StyleSheet nativo (design tokens) |

---

## 8. Diferenciadores

1. **Especializado en México** — ciudades, estados, moneda MXN, datos fiscales (RFC, régimen fiscal)
2. **Multi-rol en una sola plataforma** — cliente, planner y proveedor conviven en el mismo ecosistema
3. **Ciclo completo del evento** — desde la planeación hasta el cierre con documentos y pagos
4. **Equipo de planners** — soporte para empresas organizadoras con múltiples colaboradores
5. **UX móvil nativa** — animaciones fluidas, navegación multi-paso guiada, diseño limpio

---

## 9. Propuesta de Valor

> **Para el cliente:** Visibilidad y tranquilidad en cada paso de su evento.
>
> **Para el planner:** Centralización de todos sus eventos, equipos y proveedores en un solo lugar.
>
> **Para el proveedor:** Más visibilidad, contrataciones digitales y reputación medible.

---

## 10. Métricas de Impacto Esperadas

- **Reducción del 60%** en tiempo de coordinación manual por evento
- **Eliminación de errores** por comunicación desarticulada entre partes
- **Trazabilidad total** del presupuesto vs. gasto real
- **Escalabilidad** para planners que gestionan múltiples eventos simultáneos

---

## 11. Roadmap (Visión a Futuro)

- [ ] Chat en tiempo real entre planner, cliente y proveedores
- [ ] Notificaciones push para tareas y fechas límite
- [ ] Marketplace de proveedores con búsqueda y reseñas
- [ ] Firma digital de contratos (integración DocuSign / firma.mx)
- [ ] Dashboard analytics para planners (ingresos, eventos completados, KPIs)
- [ ] Integración con Google Calendar y Apple Calendar
- [ ] Módulo de pagos (Conekta / Stripe MX)

---

## 12. Equipo y Contexto

- **Tipo de proyecto:** Startup / Emprendimiento universitario
- **Mercado objetivo:** México — ciudades con alta demanda de eventos (CDMX, Guadalajara, Monterrey, Cancún)
- **Etapa actual:** MVP en desarrollo (módulo de autenticación y perfiles completo)
- **Tecnología:** Open-source friendly, arquitectura escalable en la nube

---

_Generado para la presentación ExpoSciencia — Abril 2026_
