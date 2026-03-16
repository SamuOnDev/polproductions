# Repaso del repositorio y pendientes sin finalizar — 2026-03-16

## Resumen rápido

El repositorio está bien encaminado como landing multidioma en Astro, pero sigue en una fase **MVP**: buena base visual, falta capa de producción (SEO técnico completo, captación real de leads, observabilidad y automatización de calidad).

## Qué puedes mejorar (priorizado)

### P0 — Impacto inmediato en negocio

1. **Hacer funcional el formulario de contacto**
   - Ahora mismo es UI-only (`<form>` sin `action`/`method`) y el botón es `type="button"`, por lo que no envía datos.
   - Acción recomendada: endpoint serverless (`/api/contact`), validación servidor, honeypot y rate-limit.

2. **Completar SEO internacional mínimo**
   - La home por idioma solo define `title`; faltan `description`, Open Graph/Twitter, canonical y `hreflang`.
   - Acción recomendada: centralizar metadatos por idioma y renderizarlos en `<head>`.

### P1 — Calidad técnica y mantenibilidad

3. **Dividir la página principal por secciones reutilizables**
   - `src/pages/[lang]/index.astro` concentra prácticamente toda la UI en un único archivo.
   - Acción recomendada: crear componentes `Hero`, `Showreel`, `Services`, `Portfolio`, `About`, `Process`, `Contact`, `Footer`.

4. **Cambiar redirección raíz por una estrategia más robusta**
   - `src/pages/index.astro` usa `meta refresh` en `<head>`.
   - Acción recomendada: redirección HTTP (si la plataforma lo permite) o estrategia oficial de Astro para i18n.

5. **Automatizar checks en CI**
   - El repo tiene scripts locales (`check`, `build`), pero no hay workflow de CI en el repo.
   - Acción recomendada: pipeline con `npm ci`, `npm run check`, `npm run build`.

### P2 — Rendimiento, accesibilidad y crecimiento

6. **Optimizar imágenes con pipeline de Astro**
   - Actualmente las imágenes vienen de `public/images` y se renderizan con `<img>` sin `width`/`height`.
   - Acción recomendada: `astro:assets` + tamaños responsivos + formatos modernos.

7. **Añadir analítica de eventos de conversión**
   - No hay integración visible con GA4/Plausible/PostHog en el código base.
   - Acción recomendada: medir CTA principal, clic de email, envío de formulario, scroll profundo.

8. **Mejorar accesibilidad del formulario y navegación móvil**
   - El formulario no tiene labels explícitos ni estados de error, y no hay menú móvil dedicado.
   - Acción recomendada: `label/for`, `aria-invalid`, mensajes de error/éxito accesibles y nav móvil con `aria-expanded`.

## Cosas sin finalizar detectadas

### A) Checklist histórico de auditoría (pendiente)

El archivo de auditoría mantiene una checklist completa aún sin cerrar (todos los ítems siguen en `[ ]`):
- metadata/OG,
- canonical/hreflang,
- sitemap/robots,
- formulario,
- analítica,
- componentización,
- tipado i18n en CI,
- optimización de imágenes,
- E2E + pipeline.

### B) Incompleto a nivel funcional hoy

- **Redirección raíz**: implementada con `meta refresh` (válida para MVP, no ideal para SEO técnico).
- **Contacto**: formulario no conectado.
- **SEO extendido**: faltan metas ricas y señales de internacionalización.
- **CI/testing**: no se observan workflows ni pruebas E2E en repo.

## Comprobaciones rápidas ejecutadas en este repaso

- Paridad de claves de i18n: ES y EN tienen el mismo número de claves (82/82, sin faltantes).
- Estado del proyecto: build y chequeos de Astro ejecutan correctamente en local.

## Propuesta de roadmap corto (2 semanas)

### Semana 1
- Implementar endpoint de contacto + validaciones + anti-spam.
- Añadir metadata SEO por idioma + canonical/hreflang + sitemap/robots.
- Instrumentar analítica básica de conversión.

### Semana 2
- Refactor por componentes.
- Migrar imágenes críticas a `astro:assets`.
- Añadir CI + test E2E mínimos de rutas `/es/` y `/en/`.
