# Auditoría técnica profunda — POLOBK Studios

Fecha: 2026-02-17

## 1) Resumen ejecutivo

Estado actual del sitio: **buena base visual + estructura simple**, pero con deuda relevante en **SEO técnico, conversión real, mantenibilidad y observabilidad**.

### Prioridad global (impacto negocio × esfuerzo)

1. **P0 — Conversión**: conectar formulario y medir eventos críticos.
2. **P0 — SEO técnico internacional**: metadatos por idioma + canonical/hreflang + sitemap/robots.
3. **P1 — Mantenibilidad**: descomponer página monolítica en componentes y tipar i18n.
4. **P1 — Performance media**: imágenes optimizadas y versiones responsive.
5. **P2 — Accesibilidad y QA**: checklist a11y + tests básicos E2E/CI.

---

## 2) Hallazgos por área

## 2.1 Arquitectura y mantenibilidad

### Hallazgos

- La homepage por idioma concentra toda la UI en un único archivo de gran tamaño (`480` líneas), lo que complica evolución, revisión y testeo por secciones.
- Hay arrays de contenido y lógica de rendering en el mismo archivo, mezclando responsabilidades (contenido, layout y lógica de presentación).
- Existe i18n por JSON y rutas estáticas, pero con tipado genérico (`Record<string, string>`), por lo que no hay validación estricta de claves en compile-time.

### Recomendaciones

- Separar en componentes: `Hero`, `Showreel`, `Portfolio`, `Services`, `About`, `Process`, `Contact`, `Footer`.
- Extraer contenido estructurado (cards, servicios, stats) a `src/content/` o `src/data/`.
- Tipar i18n con un schema derivado de `es.json` (clave fuente) para detectar missing keys en build.

### Impacto esperado

- Menor tiempo de cambios por sección.
- Menor riesgo de regresiones visuales.
- Mejor reusabilidad y posibilidad de tests unitarios por componente.

---

## 2.2 SEO técnico (multidioma)

### Hallazgos

- Solo hay `title`; faltan `meta description`, Open Graph/Twitter y `canonical`.
- No se observan `hreflang` alternates para ES/EN.
- Redirección en `/` se hace vía `meta refresh`, menos robusta para SEO que una redirección HTTP o ruta SSR/edge.

### Recomendaciones

- Definir metadatos por idioma desde diccionario/objeto tipado.
- Añadir `link rel="canonical"` y alternates `hreflang` (`es`, `en`, `x-default`).
- Generar `sitemap.xml` y `robots.txt`.
- Sustituir redirección en `index.astro` por redirección HTTP (si el despliegue lo permite) o estrategia recomendada Astro/Vercel.

### Impacto esperado

- Mejor indexación de cada idioma.
- Mejor CTR orgánico.
- Menor riesgo de contenido duplicado entre `/es/` y `/en/`.

---

## 2.3 Conversión y funnel

### Hallazgos

- El formulario actual es solo UI (sin `action`, sin integración backend) y el botón es `type="button"`.
- No hay telemetría de eventos (CTA principal, scroll depth, envío de formulario, clic en email).

### Recomendaciones

- Convertir formulario a `method="POST"` con endpoint real (serverless function o proveedor).
- Añadir validación cliente/servidor, mensajes de error/éxito y protección anti-spam (honeypot + rate limit + captcha opcional).
- Instrumentar analítica de eventos (GA4/Plausible/PostHog) con naming consistente.

### Impacto esperado

- Captura real de leads.
- Medición objetiva del rendimiento comercial de la landing.

---

## 2.4 Performance (Core Web Vitals)

### Hallazgos

- Imágenes servidas desde `public/` con `<img>` sin pipeline de optimización de Astro.
- No se declara `width/height` en imágenes principales (riesgo de CLS).
- El hero visual podría beneficiarse de prioridad explícita de carga.

### Recomendaciones

- Migrar a `astro:assets` (si aplica) con `Image` para `srcset`, formatos modernos y tamaños responsivos.
- Añadir `width`/`height` o `aspect-ratio` estable en todos los elementos multimedia.
- Definir estrategia de prioridad: hero (`fetchpriority="high"`), resto lazy.

### Impacto esperado

- Mejor LCP/CLS y percepción de velocidad.
- Menor transferencia de datos en móvil.

---

## 2.5 Accesibilidad (A11y)

### Hallazgos

- Buen uso general de focos visibles y `sr-only` en icono play.
- Hay oportunidades: landmarks más explícitos, navegación móvil dedicada, estados de formulario (`aria-invalid`, ayuda, error summary).

### Recomendaciones

- Añadir `main` y estructura semántica más fuerte por secciones.
- Implementar menú móvil accesible (botón + `aria-expanded` + gestión foco).
- Mejorar experiencia de formulario accesible y mensajes de estado.

### Impacto esperado

- Mejor usabilidad para teclado/lectores de pantalla.
- Menor fricción en formularios.

---

## 2.6 Calidad, testing y DX

### Hallazgos

- El repo ya dispone de script `check` para Astro.
- Falta pipeline de CI con checks de build/test/lint.
- Falta convención de PR/checklist de QA para cambios visuales.

### Recomendaciones

- CI mínimo: `npm ci`, `npm run check`, `npm run build`.
- Añadir tests E2E básicos (playwright) para rutas `/es/` y `/en/`.
- Añadir validación automática de paridad de claves i18n.

### Impacto esperado

- Menos roturas al desplegar.
- Mayor confianza para iterar rápido.

---

## 2.7 Seguridad y cumplimiento básico

### Hallazgos

- Sin backend de formulario todavía (menos superficie de ataque hoy), pero al activarlo habrá riesgo de spam/abuso.
- No hay política visible de privacidad/cookies, relevante si se añade analítica.

### Recomendaciones

- Al habilitar leads: sanitización, limitación por IP, logs mínimos y alertas.
- Añadir página de privacidad/cookies según mercado objetivo.
- Revisar cabeceras en deploy (HSTS, X-Content-Type-Options, etc.).

---

## 3) Plan recomendado por fases

## Fase 1 (1 semana) — Quick wins de alto impacto

- SEO base: metadatos + canonical + hreflang + sitemap + robots.
- Formulario funcional con endpoint y validación.
- Analítica de eventos críticos.

## Fase 2 (1–2 semanas) — Base técnica escalable

- Refactor a componentes por secciones.
- Tipado i18n estricto y validación de claves.
- Pipeline CI con checks obligatorios.

## Fase 3 (1 semana) — Performance y A11y

- Migración de imágenes a pipeline optimizado.
- Mejoras de accesibilidad en navegación y formulario.
- Revisión Lighthouse final y backlog de refinamiento.

---

## 4) KPIs para validar mejoras

- **SEO**: impresiones/CTR por idioma, páginas indexadas válidas.
- **Conversion**: tasa de envío formulario, CTR de CTA, CPL aproximado.
- **Performance**: LCP < 2.5s, CLS < 0.1 en móvil.
- **Calidad**: tasa de fallos en CI y tiempo medio de corrección.

---

## 5) Checklist de implementación (operativo)

- [ ] Añadir metadata por idioma + OG/Twitter.
- [ ] Añadir canonical/hreflang/x-default.
- [ ] Generar sitemap/robots.
- [ ] Conectar formulario (backend + anti-spam + validación).
- [ ] Instrumentar analítica de eventos clave.
- [ ] Separar homepage en componentes.
- [ ] Tipar diccionario i18n y validar claves en CI.
- [ ] Optimizar imágenes (responsive + formatos modernos).
- [ ] Añadir tests E2E mínimos y pipeline de CI.
