# PlannerApp — Brief para Cartel de ExpoSciencia

> Guía de contenido y diseño para el cartel físico de registro y presentación en la expo universitaria.

---

## 1. Especificaciones Técnicas

| Parámetro | Valor recomendado |
|---|---|
| **Formato** | Vertical (portrait) |
| **Dimensiones** | 70 cm × 100 cm (estándar expo) o 60 cm × 90 cm |
| **Resolución de impresión** | Mínimo 150 DPI, ideal 300 DPI |
| **Formato de archivo** | PDF para impresión (CMYK) |
| **Márgenes de seguridad** | 1 cm en todos los bordes |
| **Márgenes internos** | 2.5 cm por lado para respiro visual |

---

## 2. Estructura del Cartel (de arriba a abajo)

### Zona 1 — Encabezado (15% del cartel)
- **Logo o nombre del proyecto** — "PlannerApp" en tipografía grande y bold
- **Tagline** — Una frase que resuma el valor en menos de 10 palabras
  > _"Organiza tu evento. Sin caos. Sin excusas."_
- Nombre de la universidad + nombre del expositor(es)
- Número de proyecto o categoría (si aplica para el registro)

---

### Zona 2 — El Problema (15%)
- Título de sección: **¿Cuál es el problema?**
- 3 bullets concisos (máx. 2 líneas cada uno):
  - La coordinación de eventos en México es caótica y fragmentada
  - No existe una herramienta especializada para el mercado local
  - Clientes, planners y proveedores trabajan sin visibilidad compartida
- Apóyate en 1 cifra de impacto visual (ej. "El 70% de los eventos supera su presupuesto por falta de control")

---

### Zona 3 — La Solución (20%)
- Título: **¿Qué es PlannerApp?**
- Descripción en 2-3 líneas máximo
- **Mockup del app** — imagen de la pantalla más visual (pantalla de roles o login) centrada
- Los 3 roles como íconos con etiqueta: 👤 Cliente | 📅 Planner | 🏪 Proveedor

---

### Zona 4 — Cómo Funciona (20%)
- Título: **Flujo de la plataforma**
- Diagrama de flujo simplificado en horizontal o vertical:
  ```
  Registro por rol → Crea evento → Asigna planner → Gestión de tareas → Cierre del evento
  ```
- Puede ser un carril visual con flechas y pequeños íconos
- Máximo 5 pasos, sin texto técnico

---

### Zona 5 — Módulos y Features (15%)
- Título: **Funcionalidades principales**
- 4 cajas o íconos en cuadrícula 2×2:
  - 📋 Gestión de Tareas
  - 💰 Control de Presupuesto
  - 🤝 Directorio de Proveedores
  - 📁 Documentos Digitales
- Una línea de descripción por módulo

---

### Zona 6 — Stack / Tecnología (10%)
- Título: **Tecnología**
- Lista compacta o iconos de tecnologías:
  - React Native · Expo · TypeScript
  - Next.js · Prisma · PostgreSQL
  - Clerk (autenticación)
- No más de 2 líneas — el cartel no es documentación técnica

---

### Zona 7 — Pie de Cartel (5%)
- **QR Code** — apunta a demo, repositorio o landing page
- Nombre del equipo / expositor
- Institución + año: _XXXX Universidad · ExpoSciencia 2026_
- Opcionalmente: correo de contacto

---

## 3. Paleta de Colores

| Uso | Color | Hex |
|---|---|---|
| Primario (títulos, íconos, CTA) | Verde esmeralda | `#10b981` |
| Secundario (highlights) | Naranja | `#ea580c` |
| Fondo principal | Blanco | `#ffffff` |
| Fondo alterno (cajas) | Gris muy claro | `#f9fafb` |
| Texto principal | Casi negro | `#111827` |
| Texto secundario | Gris medio | `#6b7280` |
| Bordes y separadores | Gris suave | `#e5e7eb` |

---

## 4. Tipografía

| Elemento | Estilo | Tamaño aprox. (en cartel 70×100) |
|---|---|---|
| Nombre del proyecto | Bold 900 | 72–80 pt |
| Tagline | Regular o Light | 28–32 pt |
| Títulos de sección | Bold 700 | 36–42 pt |
| Cuerpo de texto | Regular 400 | 20–24 pt |
| Etiquetas / labels | SemiBold, mayúsculas | 14–16 pt |
| Pie de cartel | Light | 14–16 pt |

Fuentes recomendadas (gratuitas en Google Fonts):
- **Inter** — para todo el cartel (familia completa)
- **Plus Jakarta Sans** — alternativa más expresiva para títulos
- Evitar: Comic Sans, Times New Roman, Calibri

---

## 5. Principios de Diseño

1. **Una idea por sección** — si hay más de 3 bullets, es demasiado
2. **El mockup manda** — la imagen del app debe ser la pieza visual más grande del cartel
3. **Contraste alto** — texto oscuro sobre fondo claro, nunca texto gris sobre gris
4. **Espacio en blanco** — es tu aliado; un cartel saturado no se lee
5. **Jerarquía visual clara** — el ojo del lector debe seguir: título → problema → solución → cómo funciona → QR
6. **Sin decoración vacía** — cada elemento gráfico debe tener un propósito informativo
7. **El QR debe ser escaneable** — mínimo 4 cm × 4 cm en el cartel final impreso

---

## 6. Errores Comunes a Evitar

- ❌ Poner el código fuente o esquemas de base de datos en el cartel
- ❌ Usar más de 3 fuentes distintas
- ❌ Fondos con gradientes complejos que reducen legibilidad
- ❌ Texto corrido de más de 4 líneas consecutivas
- ❌ Íconos sin etiqueta de texto
- ❌ Logo de universidad demasiado pequeño o ausente
- ❌ Omitir el QR o poner uno que apunte a un link roto

---

## 7. Prompt para Canva AI / Claude Design

```
Diseña un cartel universitario vertical (70×100 cm) para la ExpoSciencia de una startup llamada PlannerApp.

El proyecto es una app móvil para organizar eventos en México que conecta Clientes, Planners y Proveedores en una sola plataforma.

Estructura del cartel:
1. Encabezado con logo, nombre y tagline
2. Sección del problema (3 puntos clave)
3. La solución con mockup del app y los 3 roles
4. Flujo simplificado (5 pasos con flechas)
5. 4 módulos clave en cuadrícula de íconos
6. Stack tecnológico en formato compacto
7. Pie con QR, nombre del equipo y universidad

Paleta: verde #10b981 como primario, naranja #ea580c como acento, fondos blancos y gris #f9fafb, texto en #111827.
Tipografía: Inter o Plus Jakarta Sans, títulos bold 700-900.
Estilo: minimalista, limpio, startup real — no académico genérico.
Incluye espaciado generoso y jerarquía visual clara de arriba hacia abajo.
```

---

*Documento de apoyo para registro y presentación en ExpoSciencia · Abril 2026*
