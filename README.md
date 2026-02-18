# POLOBK Studios Website

Landing page multidioma (ES/EN) para mostrar servicios de producción y edición de vídeo, portfolio y contacto.

## Stack

- [Astro 5](https://docs.astro.build/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- i18n simple por rutas estáticas (`/es/`, `/en/`)

## Scripts

| Command | Descripción |
|---|---|
| `npm run dev` | Inicia el entorno local en `localhost:4321` |
| `npm run build` | Genera el build de producción |
| `npm run preview` | Sirve localmente el build generado |
| `npm run check` | Ejecuta chequeos de Astro |

## Estructura principal

```text
src/
  i18n/
    locales/
      es.json
      en.json
  pages/
    index.astro
    [lang]/index.astro
  styles/
    global.css
```

## Mejores próximos pasos (recomendados)

1. **SEO técnico**
   - Añadir metadatos por idioma (`description`, OG/Twitter, canonical, hreflang).
   - Incorporar sitemap y robots.
2. **Conversión de negocio**
   - Conectar el formulario a un backend/servicio real (actualmente es UI).
   - Medir eventos clave (CTA, envío de formulario, clic email) con analítica.
3. **Rendimiento visual**
   - Migrar imágenes de `public/` a pipeline optimizado de Astro para responsive images.
   - Definir dimensiones explícitas y versiones WebP/AVIF.
4. **Mantenibilidad**
   - Separar secciones grandes de `src/pages/[lang]/index.astro` en componentes reutilizables.
   - Tipar mejor las traducciones para detectar keys faltantes en build.
