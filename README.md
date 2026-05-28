# Pol Sánchez Baena

Web personal de Pol Sánchez Baena (productor y editor de vídeo). Astro en modo server (Vercel adapter) con panel de admin propio para gestionar proyectos e imágenes.

## Stack

- [Astro 5](https://docs.astro.build/) en modo `server` con [`@astrojs/vercel`](https://docs.astro.build/en/guides/integrations-guide/vercel/).
- i18n por rutas (`/es/`, `/en/`).
- Persistencia del CMS: [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (Upstash Redis) con fallback a un fichero JSON local en `.cache/cms.json` para desarrollo.
- Subida de imágenes: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).
- Sesión admin: cookie HMAC firmada (sin librería externa).

## Scripts

| Command | Descripción |
|---|---|
| `npm run dev` | Servidor local en `localhost:4321` |
| `npm run build` | Build de producción |
| `npm run preview` | Sirve localmente el build |
| `npm run check` | Chequeos de Astro |

## Variables de entorno

Copia `.env.example` → `.env.local` y rellénalo. En producción, defínelas en el dashboard de Vercel.

```
ADMIN_USER=admin
ADMIN_PASSWORD=cambiar
SESSION_SECRET=<random 32+ hex>          # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
KV_REST_API_URL=...                      # Vercel KV / Upstash
KV_REST_API_TOKEN=...
BLOB_READ_WRITE_TOKEN=...                # Vercel Blob
PUBLIC_HIDE_ADMIN_FAB=false              # "true" para ocultar el botón flotante en prod
```

> **Sin `KV_*`**, el CMS persiste en `.cache/cms.json` (sólo válido para desarrollo local).
> **Sin `BLOB_READ_WRITE_TOKEN`**, el endpoint `/api/upload` devuelve `501`.

## Páginas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | redirect | → `/es/` |
| `/es/`, `/en/` | SSR | Home (hero, work, vertical, process, about, contact). |
| `/es/portfolio`, `/en/portfolio` | SSR | Listado completo con filtros (tipo, tag) y orden. |
| `/es/project/:id`, `/en/project/:id` | SSR | Página de detalle de proyecto. |
| `/admin/` | SSR | Login + SPA de gestión. |
| `/api/login`, `/api/logout`, `/api/session` | API | Auth. |
| `/api/cms` | API | `GET` público / `PUT` con sesión. |
| `/api/upload` | API | Sube imagen a Vercel Blob (auth). |
| `/api/reset` | API | Restaura CMS a defaults (auth). |

## Estructura

```text
src/
  components/    Nav, Footer, AdminFab, ThemeScript
  i18n/          locales + helper getDict
  layouts/       BaseLayout
  lib/           cms-types, cms-defaults, cms-store, session
  pages/
    index.astro
    [lang]/
      index.astro
      portfolio.astro
      project/[id].astro
    admin/index.astro
    api/         login, logout, session, cms, reset, upload
  scripts/       admin.ts (SPA del panel)
  styles/        global.css, admin.css
```

## CMS

El CMS guarda `{ images, projects }`:

- `images` — sólo dos claves (`hero.showreel`, `about.portrait`).
- `projects[]` — cada proyecto tiene `type: "horizontal" | "vertical"`, `title`, `subtitle`, `description`, `videoUrl` (YouTube/Vimeo/.mp4), `cover`, `tag`, `format`, `duration`, `year`, `size`, `platform`, `views`, `showOnHome`, `order`, etc.

Los **textos UI** (nav, hero, about, contact, footer…) viven en `src/i18n/locales/*.json` y no se editan desde el admin: son parte del repositorio bilingüe. Para cambiarlos, edita los JSON y haz deploy.

## Producción en Vercel

1. Provisiona **Vercel KV** (Upstash Redis) y **Vercel Blob** desde el dashboard.
2. Copia las variables de entorno en *Project Settings → Environment Variables*.
3. Define `ADMIN_USER`, `ADMIN_PASSWORD` y `SESSION_SECRET`.
4. Define `PUBLIC_HIDE_ADMIN_FAB=true` para ocultar el botón flotante en la home.
5. Deploy. El admin queda accesible en `/admin`.
