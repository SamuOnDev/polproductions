/* =====================================================
 * Pol Sánchez Baena — Admin SPA logic
 * Adapted from the mockup `admin.js`. Uses the server API
 * (/api/cms, /api/upload, /api/login, /api/logout) instead
 * of localStorage.
 * ===================================================== */
import type { CmsData, Client, Project, ProjectType, HorizontalSize } from "../lib/cms-types";
import { HOME_TEXT_GROUPS, type HomeTextField } from "../lib/home-editable";
import { LANGS, type ActiveLang } from "../i18n";
import esDict from "../i18n/locales/es.json";
import enDict from "../i18n/locales/en.json";

type Route = "editor" | "dashboard" | "home" | "proyectos" | "biblioteca" | "clientes" | "usuarios" | "ajustes";
type UserRole = "admin" | "editor";
interface CurrentSession { user: string; role: UserRole; }
interface AdminUser { username: string; role: UserRole; createdAt: number; updatedAt: number; }

const $ = <T extends Element = Element>(s: string, root: ParentNode = document) =>
    root.querySelector(s) as T | null;
const $$ = <T extends Element = Element>(s: string, root: ParentNode = document) =>
    Array.from(root.querySelectorAll(s)) as T[];

let cms: CmsData = {
    images: {},
    media: { heroShowreelImage: "", heroShowreelVideoUrl: "", aboutPortraitImage: "" },
    text: { es: {}, en: {} },
    projects: [],
    clients: [],
};
let currentRoute: Route = "dashboard";
let projectFilter: "horizontal" | "vertical" | "all" = "horizontal";
let homeTab: "media" | "text" | "visibility" = "media";
let homeTextLang: "es" | "en" = "es";
let currentSession: CurrentSession | null = null;
const fallbackText: { es: Record<string, string>; en: Record<string, string> } = {
    es: dictAsStrings(esDict as Record<string, unknown>),
    en: dictAsStrings(enDict as Record<string, unknown>),
};

function dictAsStrings(d: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const k of Object.keys(d)) {
        const v = d[k];
        if (typeof v === "string") out[k] = v;
    }
    return out;
}

function uid() {
    return "p_" + Math.random().toString(36).slice(2, 9);
}
function escapeHtml(s: unknown): string {
    return String(s ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c),
    );
}
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function flashSaved() {
    const b = $("#saveBadge") as HTMLElement | null;
    if (!b) return;
    b.hidden = false;
    clearTimeout((flashSaved as any)._t);
    (flashSaved as any)._t = setTimeout(() => (b.hidden = true), 1800);
}

async function persist(): Promise<void> {
    const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cms),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert("Error al guardar: " + (body.error || res.status));
        return;
    }
    flashSaved();
}

/**
 * Downscale + re-encode an image in the browser before uploading. Vercel serverless
 * functions reject request bodies over ~4.5 MB (HTTP 413), and full-resolution photos
 * are far too heavy for the web anyway. We cap the longest side and export WebP. Falls
 * back to the original file for SVGs, videos, or if the canvas pipeline is unavailable.
 */
async function prepareUpload(file: File): Promise<File> {
    if (file.type === "image/svg+xml" || !file.type.startsWith("image/")) return file;
    const MAX_DIM = 2200;
    const MAX_KEEP_BYTES = 3.5 * 1024 * 1024;
    try {
        const bitmap = await createImageBitmap(file);
        const longest = Math.max(bitmap.width, bitmap.height);
        const scale = Math.min(1, MAX_DIM / longest);
        if (scale === 1 && file.size <= MAX_KEEP_BYTES) {
            bitmap.close?.();
            return file;
        }
        const w = Math.round(bitmap.width * scale);
        const h = Math.round(bitmap.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            bitmap.close?.();
            return file;
        }
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close?.();
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
        if (!blob) return file;
        const base = file.name.replace(/\.[^.]+$/, "") || "image";
        return new File([blob], `${base}.webp`, { type: "image/webp" });
    } catch {
        return file;
    }
}

async function uploadFile(file: File): Promise<string | null> {
    const prepared = await prepareUpload(file);
    const form = new FormData();
    form.append("file", prepared);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (res.status === 413) {
        alert("La imagen es demasiado grande. Prueba con una más ligera.");
        return null;
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
        alert(body.error || `Error al subir la imagen (HTTP ${res.status})`);
        return null;
    }
    return body.url as string;
}

/* ── LOGIN ────────────────────────────────────────────── */
function mountLogin() {
    const form = $("#loginForm") as HTMLFormElement | null;
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = ($("#loginUser") as HTMLInputElement).value.trim();
        const pass = ($("#loginPass") as HTMLInputElement).value;
        const err = $("#loginError") as HTMLElement;
        err.textContent = "";
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ user, pass }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) {
            err.textContent = body.error || "Error al iniciar sesión";
            ($("#loginPass") as HTMLInputElement).value = "";
            ($("#loginPass") as HTMLInputElement).focus();
            return;
        }
        ($("#loginScreen") as HTMLElement).hidden = true;
        ($("#adminApp") as HTMLElement).hidden = false;
        await bootApp();
    });
}

/* ── ROUTING ──────────────────────────────────────────── */
const ROUTES: Record<Route, { title: string; render: (root: HTMLElement) => void; requiresAdmin?: boolean }> = {
    editor: { title: "Editar web", render: renderEditor },
    dashboard: { title: "Resumen", render: renderDashboard },
    home: { title: "Home", render: renderHome },
    proyectos: { title: "Proyectos", render: renderProyectos },
    biblioteca: { title: "Biblioteca", render: renderBiblioteca },
    clientes: { title: "Clientes", render: renderClientes },
    usuarios: { title: "Usuarios", render: renderUsuarios, requiresAdmin: true },
    ajustes: { title: "Ajustes", render: renderAjustes },
};

function navigate(route: Route) {
    if (!ROUTES[route]) route = "dashboard";
    if (ROUTES[route].requiresAdmin && currentSession?.role !== "admin") route = "dashboard";
    currentRoute = route;
    $$<HTMLElement>(".side-link").forEach((l) => l.classList.toggle("active", l.dataset.route === route));
    ($("#crumb") as HTMLElement).textContent = ROUTES[route].title;
    ($("#pageTitle") as HTMLElement).textContent = ROUTES[route].title;
    const content = $("#content") as HTMLElement;
    content.innerHTML = "";
    ROUTES[route].render(content);
}

/* ── EDITOR VISUAL (clic-para-editar sobre la web real) ──
 * Renders the live site in an iframe (with ?cmsedit=1) and lets the owner click any
 * element marked with data-cms-key / data-cms-slot to edit it in context. Text overrides
 * go to cms.text[lang][key]; image slots are mapped to where the Home reads them. */
let editorLang: ActiveLang = LANGS[0];
let editorPath = "/";

const EDITOR_PAGES: Array<{ label: string; path: string }> = [
    { label: "Home", path: "/" },
    { label: "Portfolio", path: "/portfolio" },
];

const TEXT_LABELS: Record<string, string> = (() => {
    const m: Record<string, string> = {};
    for (const g of HOME_TEXT_GROUPS) for (const f of g.fields) m[f.key] = f.label;
    return m;
})();

interface EditorImageSlot {
    label: string;
    get: () => string;
    set: (v: string) => void;
}

/** Map a data-cms-slot name to where the public Home actually reads/writes that image. */
function slotAccessor(slot: string): EditorImageSlot {
    if (slot === "hero.showreel") {
        return {
            label: "Imagen del reel (poster)",
            get: () => cms.media.heroShowreelImage || "",
            set: (v) => {
                cms.media.heroShowreelImage = v;
            },
        };
    }
    if (slot === "about.portrait") {
        return {
            label: "Retrato · Sobre mí",
            get: () => cms.media.aboutPortraitImage || "",
            set: (v) => {
                cms.media.aboutPortraitImage = v;
            },
        };
    }
    return {
        label: slot,
        get: () => cms.images[slot] ?? "",
        set: (v) => {
            if (v) cms.images[slot] = v;
            else delete cms.images[slot];
        },
    };
}

function editorIframeSrc(): string {
    const base = editorPath === "/" ? `/${editorLang}/` : `/${editorLang}${editorPath}`;
    return `${base}?cmsedit=1`;
}

function renderEditor(root: HTMLElement) {
    const langTabs = LANGS.map(
        (l) => `<button class="tab ${editorLang === l ? "active" : ""}" data-elang="${l}">${l.toUpperCase()}</button>`,
    ).join("");
    const pageTabs = EDITOR_PAGES.map(
        (p) => `<button class="ed-page ${editorPath === p.path ? "active" : ""}" data-epath="${escapeHtml(p.path)}">${escapeHtml(p.label)}</button>`,
    ).join("");
    root.innerHTML = `
        <div class="editor-bar">
            <div class="ed-pages">${pageTabs}</div>
            <div class="ed-right">
                <span class="ed-hint">Haz clic en cualquier texto o imagen de la web para editarlo.</span>
                ${LANGS.length > 1 ? `<div class="tabs">${langTabs}</div>` : ""}
            </div>
        </div>
        <div class="editor-frame-wrap">
            <iframe id="editorFrame" class="editor-frame" src="${editorIframeSrc()}"></iframe>
        </div>
    `;
    root.querySelectorAll<HTMLElement>(".ed-page[data-epath]").forEach((b) =>
        b.addEventListener("click", () => {
            editorPath = b.dataset.epath as string;
            navigate("editor");
        }),
    );
    root.querySelectorAll<HTMLElement>(".tab[data-elang]").forEach((b) =>
        b.addEventListener("click", () => {
            editorLang = b.dataset.elang as ActiveLang;
            navigate("editor");
        }),
    );
    const frame = root.querySelector("#editorFrame") as HTMLIFrameElement;
    frame.addEventListener("load", () => attachEditorOverlay(frame));
}

function attachEditorOverlay(frame: HTMLIFrameElement) {
    const doc = frame.contentDocument;
    if (!doc) return;
    if (!doc.getElementById("cms-ed-style")) {
        const st = doc.createElement("style");
        st.id = "cms-ed-style";
        // Inside the editor the live page is INERT: only elements marked editable react.
        // Everything else (links, buttons, the language switch, forms, players) is frozen
        // so the owner can't navigate away, submit, or otherwise lose the editor.
        st.textContent =
            "body *{pointer-events:none !important}" +
            "[data-cms-key],[data-cms-slot]{pointer-events:auto !important;cursor:pointer !important;outline:1px dashed rgba(195,243,92,.55);outline-offset:2px;transition:outline-color .15s,background .15s}" +
            "[data-cms-key] *,[data-cms-slot] *{pointer-events:none !important}" +
            "[data-cms-key]:hover,[data-cms-slot]:hover{outline:2px solid #C3F35C;background:rgba(195,243,92,.12)}";
        doc.head.appendChild(st);
    }
    doc.addEventListener(
        "click",
        (e) => {
            const target = e.target as HTMLElement | null;
            const textEl = target?.closest("[data-cms-key]") as HTMLElement | null;
            if (textEl) {
                e.preventDefault();
                e.stopPropagation();
                openTextEditor(textEl.dataset.cmsKey as string);
                return;
            }
            const imgEl = target?.closest("[data-cms-slot]") as HTMLElement | null;
            if (imgEl) {
                e.preventDefault();
                e.stopPropagation();
                openImageEditor(imgEl.dataset.cmsSlot as string);
                return;
            }
            // Anything else in the live page does nothing in edit mode.
            e.preventDefault();
            e.stopPropagation();
        },
        true,
    );
    doc.addEventListener(
        "submit",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
        },
        true,
    );
}

function reloadEditorFrame() {
    const frame = document.getElementById("editorFrame") as HTMLIFrameElement | null;
    if (frame) frame.src = editorIframeSrc();
}

function closeEditorModal() {
    document.getElementById("cmsEditorModal")?.remove();
}

function openTextEditor(key: string) {
    closeEditorModal();
    let lang: ActiveLang = editorLang;
    const label = TEXT_LABELS[key] ?? key;
    const modal = document.createElement("div");
    modal.id = "cmsEditorModal";
    modal.className = "cms-modal";

    const render = () => {
        const value = (cms.text[lang] ?? {})[key] ?? "";
        const fb = (fallbackText[lang] ?? {})[key] ?? "";
        const langTabs = LANGS.map(
            (l) => `<button class="tab ${l === lang ? "active" : ""}" data-mlang="${l}">${l.toUpperCase()}</button>`,
        ).join("");
        modal.innerHTML = `
            <div class="cms-modal-card">
                <div class="cms-modal-head">
                    <div><b>${escapeHtml(label)}</b><span class="mono">${escapeHtml(key)}</span></div>
                    <button class="cms-x" data-close>✕</button>
                </div>
                ${LANGS.length > 1 ? `<div class="tabs">${langTabs}</div>` : ""}
                <textarea class="cms-ta" placeholder="${escapeHtml(fb ? "Por defecto: " + fb : "")}">${escapeHtml(value)}</textarea>
                <div class="cms-modal-foot">
                    <button class="btn ghost" data-restore>Restaurar original</button>
                    <span style="flex:1"></span>
                    <button class="btn ghost" data-close>Cancelar</button>
                    <button class="btn solid" data-save>Guardar</button>
                </div>
            </div>
        `;
        modal.querySelectorAll<HTMLElement>("[data-mlang]").forEach((b) =>
            b.addEventListener("click", () => {
                lang = b.dataset.mlang as ActiveLang;
                render();
            }),
        );
        modal.querySelectorAll<HTMLElement>("[data-close]").forEach((b) => b.addEventListener("click", closeEditorModal));
        const ta = modal.querySelector(".cms-ta") as HTMLTextAreaElement;
        (modal.querySelector("[data-save]") as HTMLElement).addEventListener("click", async () => {
            const v = ta.value;
            if (!cms.text[lang]) cms.text[lang] = {};
            if (v.trim() === "") delete cms.text[lang][key];
            else cms.text[lang][key] = v;
            await persist();
            closeEditorModal();
            reloadEditorFrame();
        });
        (modal.querySelector("[data-restore]") as HTMLElement).addEventListener("click", async () => {
            if (cms.text[lang]) delete cms.text[lang][key];
            await persist();
            closeEditorModal();
            reloadEditorFrame();
        });
    };

    render();
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeEditorModal();
    });
    document.body.appendChild(modal);
}

function openImageEditor(slot: string) {
    closeEditorModal();
    const accessor = slotAccessor(slot);
    const current = accessor.get();
    const modal = document.createElement("div");
    modal.id = "cmsEditorModal";
    modal.className = "cms-modal";
    modal.innerHTML = `
        <div class="cms-modal-card">
            <div class="cms-modal-head">
                <div><b>${escapeHtml(accessor.label)}</b><span class="mono">${escapeHtml(slot)}</span></div>
                <button class="cms-x" data-close>✕</button>
            </div>
            <div class="cms-img-preview">${current ? `<img src="${escapeHtml(current)}" alt="">` : "Sin imagen"}</div>
            <label class="file-btn cms-upload">📷 Subir nueva imagen<input type="file" accept="image/*" id="cmsImgFile" hidden></label>
            <input type="text" class="cms-url" placeholder="o pega una URL (/...)" value="${escapeHtml(current)}">
            <p class="cms-lib-title mono">Biblioteca</p>
            <div class="cms-lib" id="cmsLib"><div class="empty-state"><p>Cargando…</p></div></div>
            <div class="cms-modal-foot">
                <button class="btn ghost" data-restore>Restaurar original</button>
                <span style="flex:1"></span>
                <button class="btn ghost" data-close>Cancelar</button>
                <button class="btn solid" data-save>Guardar</button>
            </div>
        </div>
    `;
    const urlInput = modal.querySelector(".cms-url") as HTMLInputElement;
    const preview = modal.querySelector(".cms-img-preview") as HTMLElement;
    const setUrl = (u: string) => {
        urlInput.value = u;
        preview.innerHTML = u ? `<img src="${escapeHtml(u)}" alt="">` : "Sin imagen";
    };
    modal.querySelectorAll<HTMLElement>("[data-close]").forEach((b) => b.addEventListener("click", closeEditorModal));
    (modal.querySelector("#cmsImgFile") as HTMLInputElement).addEventListener("change", async (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (!f) return;
        const uploaded = await uploadFile(f);
        if (uploaded) setUrl(uploaded);
    });
    urlInput.addEventListener("input", () => setUrl(urlInput.value));
    (modal.querySelector("[data-save]") as HTMLElement).addEventListener("click", async () => {
        accessor.set(urlInput.value.trim());
        await persist();
        closeEditorModal();
        reloadEditorFrame();
    });
    (modal.querySelector("[data-restore]") as HTMLElement).addEventListener("click", async () => {
        accessor.set("");
        await persist();
        closeEditorModal();
        reloadEditorFrame();
    });
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeEditorModal();
    });
    document.body.appendChild(modal);
    loadEditorLibrary(modal, setUrl);
}

async function loadEditorLibrary(modal: HTMLElement, pick: (u: string) => void) {
    const lib = modal.querySelector("#cmsLib") as HTMLElement;
    try {
        const res = await fetch("/api/blobs");
        const body = (await res.json()) as { ok: boolean; blobs?: Array<{ url: string; pathname: string }>; error?: string };
        if (!res.ok || !body.ok) {
            lib.innerHTML = `<div class="empty-state"><p>${escapeHtml(body.error || "Biblioteca no disponible.")}</p></div>`;
            return;
        }
        const blobs = body.blobs ?? [];
        if (!blobs.length) {
            lib.innerHTML = `<div class="empty-state"><p>Aún no hay imágenes subidas.</p></div>`;
            return;
        }
        lib.innerHTML = "";
        blobs.forEach((b) => {
            const item = document.createElement("button");
            item.className = "cms-lib-item";
            item.innerHTML = `<img src="${escapeHtml(b.url)}" alt="">`;
            item.addEventListener("click", () => pick(b.url));
            lib.appendChild(item);
        });
    } catch {
        lib.innerHTML = `<div class="empty-state"><p>Biblioteca no disponible.</p></div>`;
    }
}

/* ── DASHBOARD ────────────────────────────────────────── */
function renderDashboard(root: HTMLElement) {
    const H = cms.projects.filter((p) => p.type === "horizontal");
    const V = cms.projects.filter((p) => p.type === "vertical");
    const HhoMe = H.filter((p) => p.showOnHome !== false).length;
    const VhoMe = V.filter((p) => p.showOnHome !== false).length;
    root.innerHTML = `
        <div class="dash-grid">
            <div class="dash-card accent">
                <span class="l">Horizontal</span>
                <span class="n"><b>${H.length}</b></span>
                <span class="l">${HhoMe} visibles en home</span>
            </div>
            <div class="dash-card">
                <span class="l">Vertical</span>
                <span class="n"><b>${V.length}</b></span>
                <span class="l">${VhoMe} visibles en home</span>
            </div>
            <div class="dash-card">
                <span class="l">Total proyectos</span>
                <span class="n"><b>${cms.projects.length}</b></span>
                <span class="l">${HhoMe + VhoMe} en home</span>
            </div>
            <div class="dash-card">
                <span class="l">Reel principal</span>
                <span class="n"><b>${cms.media.heroShowreelVideoUrl ? "✓" : "—"}</b></span>
                <span class="l">${cms.media.heroShowreelVideoUrl ? "vídeo configurado" : "sin vídeo"}</span>
            </div>
        </div>
        <div class="section-card">
            <h3>Acciones rápidas <small>atajos</small></h3>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn solid" data-go="proyectos">+ Nuevo proyecto</button>
                <button class="btn ghost" data-go="home">Editar home</button>
                <button class="btn ghost" data-go="biblioteca">Biblioteca</button>
                <a class="btn ghost" href="/" target="_blank">Ver la web →</a>
            </div>
        </div>
        <div class="section-card">
            <h3>Últimos proyectos <small>los 5 más recientes</small></h3>
            <div class="proj-list" id="dashRecent"></div>
        </div>
    `;
    root.querySelectorAll<HTMLElement>("[data-go]").forEach((b) =>
        b.addEventListener("click", () => {
            const route = b.dataset.go as Route;
            navigate(route);
            if (route === "proyectos") setTimeout(() => openProjectDrawer(null, "horizontal"), 100);
        }),
    );
    const recent = [...cms.projects].slice(-5).reverse();
    const target = root.querySelector("#dashRecent") as HTMLElement;
    if (!recent.length) {
        target.innerHTML = '<div class="empty-state"><p>Todavía no hay proyectos.</p></div>';
    } else {
        recent.forEach((p) => target.appendChild(buildProjectRow(p, false)));
    }
}

/* ── PROYECTOS ────────────────────────────────────────── */
function renderProyectos(root: HTMLElement) {
    const wrap = document.createElement("div");
    const H = cms.projects.filter((p) => p.type === "horizontal");
    const V = cms.projects.filter((p) => p.type === "vertical");
    wrap.innerHTML = `
        <div class="proj-head">
            <div class="tabs" role="tablist">
                <button class="tab ${projectFilter === "horizontal" ? "active" : ""}" data-tab="horizontal">Horizontal <span class="c">${H.length}</span></button>
                <button class="tab ${projectFilter === "vertical" ? "active" : ""}" data-tab="vertical">Vertical <span class="c">${V.length}</span></button>
                <button class="tab ${projectFilter === "all" ? "active" : ""}" data-tab="all">Todos <span class="c">${cms.projects.length}</span></button>
            </div>
            <button class="btn solid" id="newProj">+ Nuevo proyecto</button>
        </div>
        <div class="proj-list" id="projList"></div>
    `;
    root.appendChild(wrap);
    wrap.querySelectorAll<HTMLElement>(".tab").forEach((t) =>
        t.addEventListener("click", () => {
            projectFilter = t.dataset.tab as typeof projectFilter;
            navigate("proyectos");
        }),
    );
    wrap
        .querySelector("#newProj")
        ?.addEventListener("click", () =>
            openProjectDrawer(null, projectFilter === "vertical" ? "vertical" : "horizontal"),
        );
    const list = wrap.querySelector("#projList") as HTMLElement;
    const filtered = projectFilter === "all" ? cms.projects : cms.projects.filter((p) => p.type === projectFilter);
    if (!filtered.length) {
        list.innerHTML = `
            <div class="empty-state">
                <h4>No hay proyectos ${projectFilter === "vertical" ? "verticales" : "horizontales"} todavía</h4>
                <p>Crea el primero para que aparezca en la home.</p>
                <button class="btn solid" id="emptyNew">+ Nuevo proyecto</button>
            </div>`;
        list
            .querySelector("#emptyNew")
            ?.addEventListener("click", () =>
                openProjectDrawer(null, projectFilter === "vertical" ? "vertical" : "horizontal"),
            );
    } else {
        [...filtered]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .forEach((p) => list.appendChild(buildProjectRow(p, true)));
    }
}

function buildProjectRow(p: Project, withActions: boolean): HTMLElement {
    const row = document.createElement("div");
    row.className = "proj-row " + (p.type === "vertical" ? "vertical" : "");
    const tagLine =
        p.type === "horizontal"
            ? [p.format, p.duration, p.year ? String(p.year) : ""].filter(Boolean).join(" · ")
            : (p.platform || "") + (p.views ? " · " + p.views : "");
    row.innerHTML = `
        <div class="thumb">${p.cover ? `<img src="${escapeHtml(p.cover)}" alt="">` : ""}</div>
        <div class="info">
            <b>${escapeHtml(p.title || "Sin título")}</b>
            <span>${escapeHtml(p.subtitle || "—")}</span>
        </div>
        <div class="meta">${escapeHtml(tagLine)}</div>
        <div class="toggle-home" title="Mostrar en home">
            <div class="switch ${p.showOnHome !== false ? "on" : ""}" data-toggle="${p.id}"></div>
            <span>${p.showOnHome !== false ? "Visible" : "Oculto"}</span>
        </div>
        ${withActions
            ? `
        <div class="actions">
            <button class="icon-btn" data-edit="${p.id}" title="Editar">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="icon-btn danger" data-del="${p.id}" title="Eliminar">
                <svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
        </div>
        `
            : ""}
    `;
    row.querySelector("[data-toggle]")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const proj = cms.projects.find((x) => x.id === p.id);
        if (!proj) return;
        proj.showOnHome = !(proj.showOnHome !== false);
        await persist();
        navigate(currentRoute);
    });
    if (withActions) {
        row.querySelector("[data-edit]")?.addEventListener("click", () => openProjectDrawer(p.id));
        row.querySelector("[data-del]")?.addEventListener("click", async () => {
            if (!confirm(`¿Eliminar "${p.title}"?`)) return;
            cms.projects = cms.projects.filter((x) => x.id !== p.id);
            await persist();
            navigate(currentRoute);
        });
    }
    return row;
}

/* ── PROJECT DRAWER ───────────────────────────────────── */
function openProjectDrawer(id: string | null, defaultType?: ProjectType) {
    const existing = id ? cms.projects.find((p) => p.id === id) : null;
    const isVertical = existing ? existing.type === "vertical" : defaultType === "vertical";
    const p: Project = existing ?? {
        id: uid(),
        type: isVertical ? "vertical" : "horizontal",
        title: "",
        subtitle: "",
        client: "",
        role: "",
        tools: "",
        description: "",
        credits: "",
        format: "16:9",
        duration: "",
        year: new Date().getFullYear(),
        tag: "Videoclip",
        size: "eq" as HorizontalSize,
        cover: "",
        videoUrl: "",
        platform: "Instagram Reels",
        views: "",
        showOnHome: true,
        order: cms.projects.filter((x) => x.type === (isVertical ? "vertical" : "horizontal")).length + 1,
    };

    const bg = ensureDrawer();
    const body = $("#drawerBody") as HTMLElement;
    const head = $("#drawerTitle") as HTMLElement;
    head.textContent = (existing ? "Editar" : "Nuevo") + " · " + (isVertical ? "Vertical" : "Horizontal");

    body.innerHTML = `
        <div class="field">
            <label>Tipo</label>
            <select data-k="type">
                <option value="horizontal" ${p.type === "horizontal" ? "selected" : ""}>Horizontal (16:9 · 21:9)</option>
                <option value="vertical" ${p.type === "vertical" ? "selected" : ""}>Vertical (9:16 · Reels/Shorts)</option>
            </select>
        </div>

        <div class="field">
            <label>Imagen de portada</label>
            <div class="img-picker">
                <div class="preview ${p.type === "vertical" ? "vertical" : ""}" id="dCoverPreview">${p.cover ? `<img src="${escapeHtml(p.cover)}" alt="">` : "Sin imagen"}</div>
                <div class="pick">
                    <input type="file" accept="image/*" id="dCoverFile" />
                    <label for="dCoverFile" class="file-btn">📷 Subir imagen</label>
                    <input type="text" data-k="cover" value="${escapeHtml(p.cover ?? "")}" placeholder="o pega una URL (/images/…)" />
                    <small>La imagen se sube a Vercel Blob y se sustituye automáticamente.</small>
                </div>
            </div>
        </div>

        <div class="field">
            <label>Título</label>
            <input type="text" data-k="title" value="${escapeHtml(p.title)}" placeholder="Ej: Barcelona Night Run" />
        </div>
        <div class="field">
            <label>Subtítulo / categoría</label>
            <input type="text" data-k="subtitle" value="${escapeHtml(p.subtitle ?? "")}" placeholder="Documental · Marca deportiva" />
        </div>

        <div data-section="horizontal" ${p.type === "vertical" ? "hidden" : ""}>
            <div class="row3">
                <div class="field">
                    <label>Formato</label>
                    <select data-k="format">
                        <option ${p.format === "16:9" ? "selected" : ""}>16:9</option>
                        <option ${p.format === "21:9" ? "selected" : ""}>21:9</option>
                        <option ${p.format === "4:3" ? "selected" : ""}>4:3</option>
                    </select>
                </div>
                <div class="field">
                    <label>Duración</label>
                    <input type="text" data-k="duration" value="${escapeHtml(p.duration ?? "")}" placeholder="03:48" />
                </div>
                <div class="field">
                    <label>Año</label>
                    <input type="number" data-k="year" value="${p.year ?? ""}" min="2000" max="2099" />
                </div>
            </div>
            <div class="row2">
                <div class="field">
                    <label>Categoría</label>
                    <select data-k="tag">
                        <option ${p.tag === "Videoclip" ? "selected" : ""}>Videoclip</option>
                        <option ${p.tag === "Comercial" ? "selected" : ""}>Comercial</option>
                        <option ${p.tag === "YouTube" ? "selected" : ""}>YouTube</option>
                        <option ${p.tag === "Documental" ? "selected" : ""}>Documental</option>
                    </select>
                </div>
                <div class="field">
                    <label>Tamaño en la home</label>
                    <select data-k="size">
                        <option value="lg" ${p.size === "lg" ? "selected" : ""}>Grande (8/12)</option>
                        <option value="md" ${p.size === "md" ? "selected" : ""}>Medio (4/12)</option>
                        <option value="eq" ${p.size === "eq" ? "selected" : ""}>Equilibrado (4/12 alto)</option>
                        <option value="half" ${p.size === "half" ? "selected" : ""}>Mitad (6/12)</option>
                    </select>
                </div>
            </div>
        </div>

        <div data-section="vertical" ${p.type === "horizontal" ? "hidden" : ""}>
            <div class="row2">
                <div class="field">
                    <label>Plataforma</label>
                    <select data-k="platform">
                        <option ${p.platform === "Instagram Reels" ? "selected" : ""}>Instagram Reels</option>
                        <option ${p.platform === "TikTok" ? "selected" : ""}>TikTok</option>
                        <option ${p.platform === "YouTube Shorts" ? "selected" : ""}>YouTube Shorts</option>
                    </select>
                </div>
                <div class="field">
                    <label>Views (texto libre)</label>
                    <input type="text" data-k="views" value="${escapeHtml(p.views ?? "")}" placeholder="4.2M views" />
                </div>
            </div>
        </div>

        <div class="field">
            <label>URL del vídeo (opcional)</label>
            <input type="url" data-k="videoUrl" value="${escapeHtml(p.videoUrl ?? "")}" placeholder="https://youtube.com/…  ·  https://vimeo.com/…" />
            <span class="field-hint">YouTube, Vimeo o link directo a .mp4. Si la rellenas, la página de detalle reproducirá el vídeo embebido.</span>
        </div>

        <h4 style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:24px 0 6px;display:flex;align-items:center;gap:10px"><span style="width:6px;height:6px;background:var(--yellow);border-radius:50%"></span> Página de detalle</h4>

        <div class="field">
            <label>Cliente</label>
            <input type="text" data-k="client" value="${escapeHtml(p.client ?? "")}" placeholder="Ej: Lume Records" />
        </div>
        <div class="field">
            <label>Tu rol</label>
            <input type="text" data-k="role" value="${escapeHtml(p.role ?? "")}" placeholder="Productor · Editor · Colorista" />
        </div>
        <div class="field">
            <label>Equipo / herramientas <i>separadas por comas</i></label>
            <input type="text" data-k="tools" value="${escapeHtml(p.tools ?? "")}" placeholder="Sony FX3, DaVinci Resolve, Premiere Pro" />
        </div>
        <div class="field">
            <label>Descripción del proyecto</label>
            <textarea data-k="description" style="min-height:120px" placeholder="Qué se hizo, cómo se hizo, contexto, retos… Usa dobles saltos de línea para separar párrafos.">${escapeHtml(p.description ?? "")}</textarea>
        </div>
        <div class="field">
            <label>Créditos <i>opcional</i></label>
            <textarea data-k="credits" placeholder="Dirección: Pol · Cámara: Marina Vidal · Música: Lume">${escapeHtml(p.credits ?? "")}</textarea>
            <span class="field-hint">Cada crédito separado por · o por salto de línea. Formato “Rol: Nombre”.</span>
        </div>

        <div class="field">
            <label>Orden de aparición</label>
            <input type="number" data-k="order" value="${p.order ?? 1}" min="1" step="1" />
            <span class="field-hint">Número más bajo = aparece antes.</span>
        </div>

        <div class="field">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                <div class="switch ${p.showOnHome !== false ? "on" : ""}" id="dShowSwitch"></div>
                <span style="text-transform:none;letter-spacing:0;font-family:inherit;color:var(--ink);font-size:14px">Mostrar en la home</span>
            </label>
        </div>
    `;

    bg.classList.add("open");
    ($("#drawer") as HTMLElement).classList.add("open");

    const typeSel = body.querySelector('[data-k="type"]') as HTMLSelectElement;
    typeSel.addEventListener("change", () => {
        const t = typeSel.value;
        (body.querySelector('[data-section="horizontal"]') as HTMLElement).hidden = t === "vertical";
        (body.querySelector('[data-section="vertical"]') as HTMLElement).hidden = t === "horizontal";
        (body.querySelector("#dCoverPreview") as HTMLElement).classList.toggle("vertical", t === "vertical");
    });

    const coverFile = body.querySelector("#dCoverFile") as HTMLInputElement;
    const coverInput = body.querySelector('[data-k="cover"]') as HTMLInputElement;
    const coverPreview = body.querySelector("#dCoverPreview") as HTMLElement;
    coverFile.addEventListener("change", async () => {
        const f = coverFile.files?.[0];
        if (!f) return;
        // Optimistic preview using data URL
        const localUrl = await fileToDataUrl(f);
        coverPreview.innerHTML = `<img src="${localUrl}" alt="">`;
        // Then upload to Blob
        const uploaded = await uploadFile(f);
        if (uploaded) {
            coverInput.value = uploaded;
            coverPreview.innerHTML = `<img src="${uploaded}" alt="">`;
        } else {
            coverInput.value = localUrl;
        }
    });
    coverInput.addEventListener("input", () => {
        const v = coverInput.value;
        coverPreview.innerHTML = v ? `<img src="${escapeHtml(v)}" alt="">` : "Sin imagen";
    });

    const showSwitch = body.querySelector("#dShowSwitch") as HTMLElement;
    showSwitch.addEventListener("click", () => showSwitch.classList.toggle("on"));

    ($("#drawerSave") as HTMLElement).onclick = async () => {
        const data: Record<string, unknown> = {};
        body.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-k]").forEach((el) => {
            const k = el.dataset.k as string;
            let v: unknown = el.value;
            if (k === "year" || k === "order") v = Number(v) || 0;
            data[k] = v;
        });
        data.id = p.id;
        data.showOnHome = (body.querySelector("#dShowSwitch") as HTMLElement).classList.contains("on");
        if (data.type === "horizontal") {
            delete data.platform;
            delete data.views;
        }
        if (data.type === "vertical") {
            delete data.format;
            delete data.duration;
            delete data.tag;
            delete data.size;
        }
        const merged = { ...p, ...data } as Project;
        if (existing) {
            const idx = cms.projects.findIndex((x) => x.id === p.id);
            cms.projects[idx] = merged;
        } else {
            cms.projects.push(merged);
        }
        await persist();
        closeDrawer();
        navigate("proyectos");
    };
    ($("#drawerCancel") as HTMLElement).onclick = closeDrawer;
    const delBtn = $("#drawerDelete") as HTMLElement;
    delBtn.hidden = !existing;
    delBtn.onclick = async () => {
        if (!confirm(`¿Eliminar "${p.title}"?`)) return;
        cms.projects = cms.projects.filter((x) => x.id !== p.id);
        await persist();
        closeDrawer();
        navigate("proyectos");
    };
}

function ensureDrawer(): HTMLElement {
    let bg = $("#drawerBg") as HTMLElement | null;
    if (bg) return bg;
    bg = document.createElement("div");
    bg.id = "drawerBg";
    bg.className = "drawer-bg";
    bg.innerHTML = `
        <aside class="drawer" id="drawer" role="dialog" aria-modal="true">
            <div class="drawer-head">
                <h3 id="drawerTitle">Nuevo proyecto</h3>
                <button class="icon-btn" id="drawerClose" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
            </div>
            <div class="drawer-body" id="drawerBody"></div>
            <div class="drawer-foot">
                <button class="btn danger sm" id="drawerDelete" hidden>Eliminar</button>
                <div style="display:flex;gap:10px;margin-left:auto">
                    <button class="btn ghost" id="drawerCancel">Cancelar</button>
                    <button class="btn solid" id="drawerSave">Guardar proyecto</button>
                </div>
            </div>
        </aside>
    `;
    document.body.appendChild(bg);
    bg.addEventListener("click", (e) => {
        if (e.target === bg) closeDrawer();
    });
    bg.querySelector("#drawerClose")?.addEventListener("click", closeDrawer);
    return bg;
}

function closeDrawer() {
    const bg = $("#drawerBg") as HTMLElement | null;
    if (!bg) return;
    bg.classList.remove("open");
    $("#drawer")?.classList.remove("open");
}

/* ── HOME ─────────────────────────────────────────────── */
function renderHome(root: HTMLElement) {
    root.innerHTML = `
        <div class="proj-head">
            <div class="tabs" role="tablist">
                <button class="tab ${homeTab === "media" ? "active" : ""}" data-htab="media">Media</button>
                <button class="tab ${homeTab === "text" ? "active" : ""}" data-htab="text">Textos</button>
                <button class="tab ${homeTab === "visibility" ? "active" : ""}" data-htab="visibility">Visibilidad</button>
            </div>
        </div>
        <div id="homeTabBody"></div>
    `;
    root.querySelectorAll<HTMLElement>(".tab[data-htab]").forEach((t) =>
        t.addEventListener("click", () => {
            homeTab = t.dataset.htab as typeof homeTab;
            navigate("home");
        }),
    );
    const body = root.querySelector("#homeTabBody") as HTMLElement;
    if (homeTab === "media") renderHomeMedia(body);
    else if (homeTab === "text") renderHomeText(body);
    else renderHomeVisibility(body);
}

function renderHomeMedia(root: HTMLElement) {
    root.innerHTML = `
        <div class="section-card">
            <h3>Reel principal <small>se reproduce en bucle en la home</small></h3>
            <div class="row2" id="heroBlock"></div>
        </div>
        <div class="section-card">
            <h3>Sobre mí <small>retrato grande</small></h3>
            <div class="row2" id="aboutBlock"></div>
        </div>
    `;
    const heroBlock = root.querySelector("#heroBlock") as HTMLElement;
    heroBlock.appendChild(buildMediaImageField("Imagen del reel (fallback / poster)", cms.media.heroShowreelImage || "", async (v) => {
        cms.media.heroShowreelImage = v;
        await persist();
    }));
    heroBlock.appendChild(buildMediaVideoField("URL del vídeo del reel", cms.media.heroShowreelVideoUrl || "", async (v) => {
        cms.media.heroShowreelVideoUrl = v;
        await persist();
    }));

    const aboutBlock = root.querySelector("#aboutBlock") as HTMLElement;
    aboutBlock.appendChild(buildMediaImageField("Retrato de la sección Sobre mí", cms.media.aboutPortraitImage || "", async (v) => {
        cms.media.aboutPortraitImage = v;
        await persist();
    }));
}

function buildMediaImageField(label: string, value: string, save: (v: string) => Promise<void>): HTMLElement {
    const div = document.createElement("div");
    div.className = "field";
    const id = "mf-" + Math.random().toString(36).slice(2, 8);
    div.innerHTML = `
        <label>${escapeHtml(label)}</label>
        <div class="img-picker">
            <div class="preview">${value ? `<img src="${escapeHtml(value)}" alt="">` : "Sin imagen"}</div>
            <div class="pick">
                <input type="file" accept="image/*" id="${id}" />
                <label for="${id}" class="file-btn">📷 Subir imagen</label>
                <input type="text" value="${escapeHtml(value)}" placeholder="o pega una URL (/images/…)" />
            </div>
        </div>
    `;
    const fileInput = div.querySelector(`#${id}`) as HTMLInputElement;
    const textInput = div.querySelector('input[type="text"]') as HTMLInputElement;
    const preview = div.querySelector(".preview") as HTMLElement;
    fileInput.addEventListener("change", async () => {
        const f = fileInput.files?.[0];
        if (!f) return;
        const localUrl = await fileToDataUrl(f);
        preview.innerHTML = `<img src="${localUrl}" alt="">`;
        const uploaded = await uploadFile(f);
        const finalUrl = uploaded ?? localUrl;
        textInput.value = finalUrl;
        preview.innerHTML = `<img src="${finalUrl}" alt="">`;
        await save(finalUrl);
    });
    textInput.addEventListener("change", async () => {
        const v = textInput.value;
        preview.innerHTML = v ? `<img src="${escapeHtml(v)}" alt="">` : "Sin imagen";
        await save(v);
    });
    return div;
}

function buildMediaVideoField(label: string, value: string, save: (v: string) => Promise<void>): HTMLElement {
    const div = document.createElement("div");
    div.className = "field";
    div.innerHTML = `
        <label>${escapeHtml(label)}</label>
        <input type="url" value="${escapeHtml(value)}" placeholder="https://youtu.be/…  ·  https://…/clip.mp4" />
        <span class="field-hint">YouTube, Vimeo o link directo .mp4 / .webm. Se reproduce silenciado y en bucle. Deja vacío para usar solo la imagen.</span>
    `;
    const input = div.querySelector("input") as HTMLInputElement;
    input.addEventListener("change", async () => {
        await save(input.value.trim());
    });
    return div;
}

function renderHomeText(root: HTMLElement) {
    const overrides = cms.text[homeTextLang] || {};
    root.innerHTML = `
        <div class="section-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <p style="font-size:13px;color:var(--muted);margin:0">Sobrescribe los textos de la home por idioma. Si dejas un campo vacío, se usa el texto por defecto del sitio.</p>
            <div class="tabs">
                <button class="tab ${homeTextLang === "es" ? "active" : ""}" data-tlang="es">ES</button>
                <button class="tab ${homeTextLang === "en" ? "active" : ""}" data-tlang="en">EN</button>
            </div>
        </div>
        <div id="homeTextGroups"></div>
    `;
    root.querySelectorAll<HTMLElement>(".tab[data-tlang]").forEach((t) =>
        t.addEventListener("click", () => {
            homeTextLang = t.dataset.tlang as typeof homeTextLang;
            navigate("home");
        }),
    );
    const wrap = root.querySelector("#homeTextGroups") as HTMLElement;
    HOME_TEXT_GROUPS.forEach((group) => {
        const card = document.createElement("div");
        card.className = "section-card";
        const inner = group.fields.map((f) => buildTextFieldHtml(f, overrides[f.key] ?? "", fallbackText[homeTextLang][f.key] ?? "")).join("");
        card.innerHTML = `<h3>${escapeHtml(group.title)} <small>${group.fields.length} campos</small></h3>${inner}`;
        wrap.appendChild(card);
        card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-tkey]").forEach((el) => {
            el.addEventListener("change", async () => {
                const key = el.dataset.tkey as string;
                const v = el.value;
                if (!cms.text[homeTextLang]) cms.text[homeTextLang] = {};
                if (v.trim() === "") delete cms.text[homeTextLang][key];
                else cms.text[homeTextLang][key] = v;
                await persist();
            });
        });
    });
}

function buildTextFieldHtml(field: HomeTextField, value: string, fallback: string): string {
    const labelHint = field.allowsHtml ? ' <i>admite &lt;b&gt;</i>' : "";
    const placeholder = fallback ? `por defecto: ${fallback.slice(0, 80)}${fallback.length > 80 ? "…" : ""}` : "";
    if (field.multiline) {
        return `
            <div class="field">
                <label>${escapeHtml(field.label)}${labelHint}</label>
                <textarea data-tkey="${escapeHtml(field.key)}" placeholder="${escapeHtml(placeholder)}" style="min-height:80px">${escapeHtml(value)}</textarea>
            </div>
        `;
    }
    return `
        <div class="field">
            <label>${escapeHtml(field.label)}${labelHint}</label>
            <input type="text" data-tkey="${escapeHtml(field.key)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />
        </div>
    `;
}

function renderHomeVisibility(root: HTMLElement) {
    root.innerHTML = `
        <div class="section-card">
            <p style="font-size:13px;color:var(--muted);margin:0 0 14px">Controla qué proyectos aparecen en la home y en qué orden. El número más bajo aparece antes.</p>
            <h3 style="margin-top:6px">Horizontales <small>${cms.projects.filter((p) => p.type === "horizontal").length}</small></h3>
            <div class="proj-list" id="visH" style="margin-top:10px"></div>
        </div>
        <div class="section-card">
            <h3>Verticales <small>${cms.projects.filter((p) => p.type === "vertical").length}</small></h3>
            <div class="proj-list" id="visV" style="margin-top:10px"></div>
        </div>
    `;
    const buildList = (type: ProjectType, target: HTMLElement) => {
        const list = cms.projects.filter((p) => p.type === type).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (!list.length) {
            target.innerHTML = '<div class="empty-state"><p>No hay proyectos de este tipo.</p></div>';
            return;
        }
        list.forEach((p) => target.appendChild(buildVisibilityRow(p)));
    };
    buildList("horizontal", root.querySelector("#visH") as HTMLElement);
    buildList("vertical", root.querySelector("#visV") as HTMLElement);
}

function buildVisibilityRow(p: Project): HTMLElement {
    const row = document.createElement("div");
    row.className = "proj-row " + (p.type === "vertical" ? "vertical" : "");
    row.innerHTML = `
        <div class="thumb">${p.cover ? `<img src="${escapeHtml(p.cover)}" alt="">` : ""}</div>
        <div class="info">
            <b>${escapeHtml(p.title || "Sin título")}</b>
            <span>${escapeHtml(p.subtitle || "—")}</span>
        </div>
        <div class="meta" style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Orden</span>
            <input type="number" data-order min="1" step="1" value="${p.order ?? 1}" style="width:64px" />
        </div>
        <div class="toggle-home" title="Mostrar en home">
            <div class="switch ${p.showOnHome !== false ? "on" : ""}" data-toggle></div>
            <span>${p.showOnHome !== false ? "Visible" : "Oculto"}</span>
        </div>
    `;
    row.querySelector("[data-toggle]")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const proj = cms.projects.find((x) => x.id === p.id);
        if (!proj) return;
        proj.showOnHome = !(proj.showOnHome !== false);
        await persist();
        navigate("home");
    });
    row.querySelector("[data-order]")?.addEventListener("change", async (e) => {
        const proj = cms.projects.find((x) => x.id === p.id);
        if (!proj) return;
        const v = Number((e.target as HTMLInputElement).value) || 1;
        proj.order = v;
        await persist();
        navigate("home");
    });
    return row;
}

/* ── BIBLIOTECA ───────────────────────────────────────── */
function renderBiblioteca(root: HTMLElement) {
    root.innerHTML = `
        <div class="section-card">
            <h3>Subir archivo <small>sin asignar — útil para tener material listo</small></h3>
            <div class="img-picker">
                <div class="preview" id="libPreview">Selecciona un archivo</div>
                <div class="pick">
                    <input type="file" accept="image/*,video/*" id="libFile" />
                    <label for="libFile" class="file-btn">📷 Elegir archivo</label>
                    <span class="field-hint" id="libStatus">Se sube a Vercel Blob. No queda asignado a ningún proyecto hasta que tú lo uses.</span>
                </div>
            </div>
        </div>
        <div class="section-card">
            <h3>Archivos subidos <small id="libCount">cargando…</small></h3>
            <div class="img-grid" id="libGrid"></div>
        </div>
    `;
    const file = root.querySelector("#libFile") as HTMLInputElement;
    const preview = root.querySelector("#libPreview") as HTMLElement;
    const status = root.querySelector("#libStatus") as HTMLElement;
    file.addEventListener("change", async () => {
        const f = file.files?.[0];
        if (!f) return;
        const localUrl = await fileToDataUrl(f);
        preview.innerHTML = `<img src="${localUrl}" alt="">`;
        status.textContent = "Subiendo…";
        const uploaded = await uploadFile(f);
        if (uploaded) {
            status.innerHTML = `Subido: <b style="color:var(--ink);font-family:'Roboto Mono',monospace">${escapeHtml(uploaded)}</b>`;
            await loadAndRenderLibrary(root);
        } else {
            status.textContent = "Error en la subida.";
        }
    });
    loadAndRenderLibrary(root);
}

async function loadAndRenderLibrary(root: HTMLElement) {
    const grid = root.querySelector("#libGrid") as HTMLElement;
    const count = root.querySelector("#libCount") as HTMLElement;
    grid.innerHTML = '<div class="empty-state"><p>Cargando…</p></div>';
    try {
        const res = await fetch("/api/blobs");
        const body = (await res.json()) as { ok: boolean; blobs?: Array<{ url: string; pathname: string; size: number; uploadedAt: string }>; error?: string };
        if (!res.ok || !body.ok) {
            grid.innerHTML = `<div class="empty-state"><p>${escapeHtml(body.error || "No se pudieron listar los archivos.")}</p></div>`;
            count.textContent = "—";
            return;
        }
        const blobs = body.blobs ?? [];
        count.textContent = `${blobs.length} archivos`;
        if (!blobs.length) {
            grid.innerHTML = '<div class="empty-state"><p>Todavía no hay archivos subidos.</p></div>';
            return;
        }
        grid.innerHTML = "";
        const inUse = new Set<string>();
        cms.projects.forEach((p) => { if (p.cover) inUse.add(p.cover); });
        if (cms.media.heroShowreelImage) inUse.add(cms.media.heroShowreelImage);
        if (cms.media.aboutPortraitImage) inUse.add(cms.media.aboutPortraitImage);
        blobs.forEach((b) => {
            const isVideo = /\.(mp4|webm|mov)$/i.test(b.pathname);
            const card = document.createElement("div");
            card.className = "img-card";
            const used = inUse.has(b.url);
            card.innerHTML = `
                <div class="ph">${isVideo ? `<video src="${escapeHtml(b.url)}" muted></video>` : `<img src="${escapeHtml(b.url)}" alt="">`}</div>
                <div class="info">
                    <b>${escapeHtml(b.pathname.replace(/^cms\//, ""))}</b>
                    <span>${(b.size / 1024).toFixed(0)} KB · ${used ? "<b style='color:var(--green)'>En uso</b>" : "<span style='color:var(--muted)'>Sin usar</span>"}</span>
                </div>
                <div style="display:flex;gap:6px;padding:0 12px 12px">
                    <button class="btn ghost sm" data-copy="${escapeHtml(b.url)}">Copiar URL</button>
                    <button class="btn danger sm" data-del="${escapeHtml(b.url)}" ${used ? "disabled" : ""}>Eliminar</button>
                </div>
            `;
            grid.appendChild(card);
        });
        grid.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((b) => {
            b.addEventListener("click", () => {
                navigator.clipboard.writeText(b.dataset.copy || "");
                b.textContent = "✓ Copiado";
                setTimeout(() => (b.textContent = "Copiar URL"), 1200);
            });
        });
        grid.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((b) => {
            b.addEventListener("click", async () => {
                if (b.disabled) return;
                const url = b.dataset.del as string;
                if (!confirm(`¿Eliminar este archivo?\n${url}`)) return;
                const res = await fetch("/api/blobs?url=" + encodeURIComponent(url), { method: "DELETE" });
                const body2 = await res.json().catch(() => ({}));
                if (!res.ok || !body2.ok) {
                    alert(body2.error || "Error al eliminar.");
                    return;
                }
                await loadAndRenderLibrary(root);
            });
        });
    } catch (err) {
        grid.innerHTML = `<div class="empty-state"><p>${escapeHtml((err as Error).message)}</p></div>`;
    }
}

/* ── CLIENTES ─────────────────────────────────────────── */
function renderClientes(root: HTMLElement) {
    root.innerHTML = `
        <div class="proj-head">
            <h3 style="margin:0">Clientes y colaboradores <small>logos del carrusel de la home</small></h3>
            <button class="btn solid" id="newClient">+ Nuevo cliente</button>
        </div>
        <div class="section-card">
            <p style="font-size:13px;color:var(--muted);margin:0 0 14px">Cada cliente aparece en el carrusel de la home. Si subes un logo se muestra el logo; si no, el nombre. La URL (opcional) hace el logo clicable.</p>
            <div id="clientList"></div>
        </div>
    `;
    root.querySelector("#newClient")?.addEventListener("click", async () => {
        cms.clients.push({ id: uid(), name: "Nuevo cliente", url: "", logo: "" });
        await persist();
        navigate("clientes");
    });
    const list = root.querySelector("#clientList") as HTMLElement;
    if (!cms.clients.length) {
        list.innerHTML = '<div class="empty-state"><p>Aún no hay clientes. Añade el primero para que aparezca en el carrusel.</p></div>';
        return;
    }
    cms.clients.forEach((c) => list.appendChild(buildClientRow(c)));
}

function buildClientRow(c: Client): HTMLElement {
    const row = document.createElement("div");
    row.className = "client-row";
    const fileId = "cl-" + Math.random().toString(36).slice(2, 8);
    row.innerHTML = `
        <div class="client-logo">
            <div class="preview">${c.logo ? `<img src="${escapeHtml(c.logo)}" alt="">` : "Sin logo"}</div>
            <input type="file" accept="image/*" id="${fileId}" hidden />
            <label for="${fileId}" class="file-btn">📷 Subir logo</label>
        </div>
        <div class="client-fields">
            <input type="text" data-k="name" value="${escapeHtml(c.name)}" placeholder="Nombre de la empresa" />
            <input type="url" data-k="url" value="${escapeHtml(c.url ?? "")}" placeholder="https://… (opcional)" />
            <input type="text" data-k="logo" value="${escapeHtml(c.logo ?? "")}" placeholder="o pega una URL de logo (/images/…)" />
        </div>
        <button class="icon-btn danger" data-del title="Eliminar">
            <svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
    `;
    const preview = row.querySelector(".preview") as HTMLElement;
    const fileInput = row.querySelector(`#${fileId}`) as HTMLInputElement;
    const logoInput = row.querySelector('[data-k="logo"]') as HTMLInputElement;
    fileInput.addEventListener("change", async () => {
        const f = fileInput.files?.[0];
        if (!f) return;
        const localUrl = await fileToDataUrl(f);
        preview.innerHTML = `<img src="${localUrl}" alt="">`;
        const uploaded = await uploadFile(f);
        const finalUrl = uploaded ?? localUrl;
        logoInput.value = finalUrl;
        preview.innerHTML = `<img src="${escapeHtml(finalUrl)}" alt="">`;
        c.logo = finalUrl;
        await persist();
    });
    row.querySelectorAll<HTMLInputElement>("[data-k]").forEach((el) => {
        el.addEventListener("change", async () => {
            const k = el.dataset.k as string;
            if (k === "name") c.name = el.value;
            else if (k === "url") c.url = el.value;
            else if (k === "logo") {
                c.logo = el.value;
                preview.innerHTML = el.value ? `<img src="${escapeHtml(el.value)}" alt="">` : "Sin logo";
            }
            await persist();
        });
    });
    row.querySelector("[data-del]")?.addEventListener("click", async () => {
        if (!confirm(`¿Eliminar "${c.name}"?`)) return;
        cms.clients = cms.clients.filter((x) => x.id !== c.id);
        await persist();
        navigate("clientes");
    });
    return row;
}

/* ── AJUSTES ──────────────────────────────────────────── */
function renderAjustes(root: HTMLElement) {
    const sess = currentSession;
    const sessInfo = sess
        ? `Conectado como <b style="color:var(--ink);font-family:'Roboto Mono',monospace">${escapeHtml(sess.user)}</b> · rol <b style="color:var(--ink)">${escapeHtml(sess.role)}</b>`
        : "Sin sesión";
    root.innerHTML = `
        <div class="section-card">
            <h3>Sesión <small>cuenta de acceso</small></h3>
            <p style="font-size:13px;color:var(--muted);margin-bottom:14px">${sessInfo}</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn solid" id="changePassBtn">Cambiar mi contraseña</button>
                <button class="btn ghost" id="logoutBtn2">Cerrar sesión</button>
            </div>
        </div>
        <div class="section-card">
            <h3>Datos / mantenimiento <small>zona de cuidado</small></h3>
            <div style="display:flex;flex-direction:column;gap:10px">
                <button class="btn ghost" id="exportJSON">📥 Exportar contenido (JSON)</button>
                <label class="btn ghost" style="cursor:pointer;width:max-content">
                    📤 Importar contenido (JSON)
                    <input type="file" accept="application/json" id="importJSON" hidden />
                </label>
                <button class="btn danger" id="resetCMS">🗑 Restaurar contenido por defecto</button>
            </div>
        </div>
    `;
    root.querySelector("#exportJSON")?.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(cms, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "polsanchezbaena-cms-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
    });
    root.querySelector("#importJSON")?.addEventListener("change", async (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (!f) return;
        try {
            const text = await f.text();
            const data = JSON.parse(text) as CmsData;
            if (!data.images || !Array.isArray(data.projects)) throw new Error("JSON inválido");
            cms = data;
            await persist();
            alert("Contenido importado correctamente.");
            navigate("dashboard");
        } catch (err) {
            alert("No se pudo importar: " + (err as Error).message);
        }
    });
    root.querySelector("#resetCMS")?.addEventListener("click", async () => {
        if (!confirm("Esto restaurará todo el contenido a los valores por defecto. ¿Continuar?")) return;
        const res = await fetch("/api/reset", { method: "POST" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) {
            alert(body.error || "Error al restaurar");
            return;
        }
        cms = body.data as CmsData;
        flashSaved();
        navigate("dashboard");
    });
    root.querySelector("#logoutBtn2")?.addEventListener("click", () => doLogout());
    root.querySelector("#changePassBtn")?.addEventListener("click", () => openChangePasswordModal());
}

function openChangePasswordModal() {
    const existing = document.getElementById("pwModalBg");
    if (existing) existing.remove();
    const bg = document.createElement("div");
    bg.id = "pwModalBg";
    bg.className = "drawer-bg open";
    bg.innerHTML = `
        <aside class="drawer open" role="dialog" aria-modal="true" style="max-width:480px">
            <div class="drawer-head">
                <h3>Cambiar contraseña</h3>
                <button class="icon-btn" id="pwClose" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
            </div>
            <div class="drawer-body">
                <div class="field">
                    <label>Contraseña actual</label>
                    <input type="password" id="pwCurrent" autocomplete="current-password" />
                </div>
                <div class="field">
                    <label>Nueva contraseña <i>mínimo 12 caracteres</i></label>
                    <input type="password" id="pwNext" autocomplete="new-password" />
                </div>
                <div class="field">
                    <label>Confirmar nueva contraseña</label>
                    <input type="password" id="pwConfirm" autocomplete="new-password" />
                </div>
                <div class="login-error" id="pwError" style="min-height:18px"></div>
                <p class="field-hint">Al cambiar la contraseña se cerrarán todas tus sesiones abiertas. Tendrás que volver a entrar.</p>
            </div>
            <div class="drawer-foot">
                <div style="display:flex;gap:10px;margin-left:auto">
                    <button class="btn ghost" id="pwCancel">Cancelar</button>
                    <button class="btn solid" id="pwSave">Guardar</button>
                </div>
            </div>
        </aside>
    `;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.querySelector("#pwClose")?.addEventListener("click", close);
    bg.querySelector("#pwCancel")?.addEventListener("click", close);
    bg.addEventListener("click", (e) => { if (e.target === bg) close(); });
    bg.querySelector("#pwSave")?.addEventListener("click", async () => {
        const current = ($("#pwCurrent") as HTMLInputElement).value;
        const next = ($("#pwNext") as HTMLInputElement).value;
        const confirm = ($("#pwConfirm") as HTMLInputElement).value;
        const err = $("#pwError") as HTMLElement;
        err.textContent = "";
        if (next.length < 12) { err.textContent = "La nueva contraseña debe tener al menos 12 caracteres."; return; }
        if (next !== confirm) { err.textContent = "Las contraseñas no coinciden."; return; }
        const res = await fetch("/api/account/password", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ current, next }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) { err.textContent = body.error || "Error al cambiar la contraseña."; return; }
        close();
        alert("Contraseña actualizada. Vuelve a iniciar sesión.");
        await doLogout();
    });
}

/* ── USUARIOS ─────────────────────────────────────────── */
function renderUsuarios(root: HTMLElement) {
    if (currentSession?.role !== "admin") {
        root.innerHTML = '<div class="empty-state"><p>Solo los administradores pueden gestionar usuarios.</p></div>';
        return;
    }
    root.innerHTML = `
        <div class="proj-head">
            <h3 style="margin:0">Usuarios del panel <small>${currentSession ? "tú: " + escapeHtml(currentSession.user) : ""}</small></h3>
            <button class="btn solid" id="newUserBtn">+ Nuevo usuario</button>
        </div>
        <div class="section-card">
            <div id="usersList">Cargando…</div>
        </div>
    `;
    root.querySelector("#newUserBtn")?.addEventListener("click", () => openUserModal(null));
    loadAndRenderUsers(root);
}

async function loadAndRenderUsers(root: HTMLElement) {
    const list = root.querySelector("#usersList") as HTMLElement;
    try {
        const res = await fetch("/api/admin/users");
        const body = (await res.json()) as { ok: boolean; users?: AdminUser[]; error?: string };
        if (!res.ok || !body.ok || !body.users) {
            list.innerHTML = `<div class="empty-state"><p>${escapeHtml(body.error || "Error al cargar usuarios.")}</p></div>`;
            return;
        }
        if (!body.users.length) {
            list.innerHTML = '<div class="empty-state"><p>No hay usuarios.</p></div>';
            return;
        }
        list.innerHTML = "";
        body.users.forEach((u) => list.appendChild(buildUserRow(u, root)));
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p>${escapeHtml((err as Error).message)}</p></div>`;
    }
}

function buildUserRow(u: AdminUser, root: HTMLElement): HTMLElement {
    const row = document.createElement("div");
    row.className = "proj-row";
    const isSelf = currentSession?.user === u.username;
    row.innerHTML = `
        <div class="thumb" style="display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--muted);font-size:18px">${escapeHtml(u.username.slice(0, 1).toUpperCase())}</div>
        <div class="info">
            <b>${escapeHtml(u.username)} ${isSelf ? '<span style="color:var(--muted);font-weight:400;font-size:11px;text-transform:uppercase;letter-spacing:.06em">tú</span>' : ""}</b>
            <span>Creado ${new Date(u.createdAt).toLocaleDateString("es-ES")}</span>
        </div>
        <div class="meta">
            <select data-role="${escapeHtml(u.username)}">
                <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
                <option value="editor" ${u.role === "editor" ? "selected" : ""}>editor</option>
            </select>
        </div>
        <div class="actions">
            <button class="btn ghost sm" data-resetpass="${escapeHtml(u.username)}">Resetear pwd</button>
            <button class="icon-btn danger" data-deluser="${escapeHtml(u.username)}" title="Eliminar" ${isSelf ? "disabled" : ""}>
                <svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
        </div>
    `;
    row.querySelector(`[data-role="${u.username}"]`)?.addEventListener("change", async (e) => {
        const newRole = (e.target as HTMLSelectElement).value;
        const res = await fetch(`/api/admin/users/${encodeURIComponent(u.username)}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ role: newRole }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) {
            alert(body.error || "Error al actualizar el rol.");
            await loadAndRenderUsers(root);
            return;
        }
        flashSaved();
        await loadAndRenderUsers(root);
    });
    row.querySelector(`[data-resetpass="${u.username}"]`)?.addEventListener("click", () => openUserModal(u));
    row.querySelector(`[data-deluser="${u.username}"]`)?.addEventListener("click", async (e) => {
        if ((e.currentTarget as HTMLButtonElement).disabled) return;
        if (!confirm(`¿Eliminar al usuario "${u.username}"?`)) return;
        const res = await fetch(`/api/admin/users/${encodeURIComponent(u.username)}`, { method: "DELETE" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) { alert(body.error || "Error al eliminar."); return; }
        await loadAndRenderUsers(root);
    });
    return row;
}

function openUserModal(editing: AdminUser | null) {
    const existing = document.getElementById("userModalBg");
    if (existing) existing.remove();
    const bg = document.createElement("div");
    bg.id = "userModalBg";
    bg.className = "drawer-bg open";
    bg.innerHTML = `
        <aside class="drawer open" role="dialog" aria-modal="true" style="max-width:480px">
            <div class="drawer-head">
                <h3>${editing ? "Resetear contraseña · " + escapeHtml(editing.username) : "Nuevo usuario"}</h3>
                <button class="icon-btn" id="umClose" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
            </div>
            <div class="drawer-body">
                ${editing ? "" : `
                <div class="field">
                    <label>Usuario <i>3-32 chars, alfanumérico, _ o -</i></label>
                    <input type="text" id="umUser" autocomplete="off" />
                </div>
                <div class="field">
                    <label>Rol</label>
                    <select id="umRole">
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                    </select>
                </div>`}
                <div class="field">
                    <label>${editing ? "Nueva contraseña" : "Contraseña"} <i>mínimo 12 caracteres</i></label>
                    <input type="password" id="umPass" autocomplete="new-password" />
                </div>
                <div class="login-error" id="umError" style="min-height:18px"></div>
                ${editing ? '<p class="field-hint">Al resetear la contraseña, todas las sesiones de este usuario quedan invalidadas.</p>' : ""}
            </div>
            <div class="drawer-foot">
                <div style="display:flex;gap:10px;margin-left:auto">
                    <button class="btn ghost" id="umCancel">Cancelar</button>
                    <button class="btn solid" id="umSave">${editing ? "Resetear" : "Crear usuario"}</button>
                </div>
            </div>
        </aside>
    `;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.querySelector("#umClose")?.addEventListener("click", close);
    bg.querySelector("#umCancel")?.addEventListener("click", close);
    bg.addEventListener("click", (e) => { if (e.target === bg) close(); });
    bg.querySelector("#umSave")?.addEventListener("click", async () => {
        const pass = ($("#umPass") as HTMLInputElement).value;
        const err = $("#umError") as HTMLElement;
        err.textContent = "";
        if (pass.length < 12) { err.textContent = "La contraseña debe tener al menos 12 caracteres."; return; }
        if (editing) {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(editing.username)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ password: pass }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok || !body.ok) { err.textContent = body.error || "Error al resetear."; return; }
        } else {
            const username = ($("#umUser") as HTMLInputElement).value.trim();
            const role = ($("#umRole") as HTMLSelectElement).value;
            if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) { err.textContent = "Usuario inválido."; return; }
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ username, password: pass, role }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok || !body.ok) { err.textContent = body.error || "Error al crear."; return; }
        }
        close();
        const content = $("#content") as HTMLElement;
        await loadAndRenderUsers(content);
        flashSaved();
    });
}

async function doLogout() {
    await fetch("/api/logout", { method: "POST" });
    location.reload();
}

/* ── BOOT ─────────────────────────────────────────────── */
async function loadCmsFromServer(): Promise<void> {
    const res = await fetch("/api/cms");
    if (!res.ok) throw new Error("No se pudo cargar el CMS");
    cms = (await res.json()) as CmsData;
    if (!Array.isArray(cms.clients)) cms.clients = [];
}

async function loadSession(): Promise<void> {
    try {
        const res = await fetch("/api/session");
        const body = (await res.json()) as { authed: boolean; user?: string; role?: UserRole };
        currentSession = body.authed && body.user && body.role ? { user: body.user, role: body.role } : null;
    } catch {
        currentSession = null;
    }
}

function applyRoleVisibility() {
    const isAdmin = currentSession?.role === "admin";
    $$<HTMLElement>(".side-link[data-route='usuarios']").forEach((l) => { l.hidden = !isAdmin; });
}

async function bootApp() {
    await loadSession();
    await loadCmsFromServer();
    applyRoleVisibility();
    $$<HTMLElement>(".side-link").forEach((l) =>
        l.addEventListener("click", () => navigate(l.dataset.route as Route)),
    );
    $("#themeBtn")?.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        const next = cur === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try {
            localStorage.setItem("psb_theme", next);
        } catch {}
    });
    $("#logoutBtn")?.addEventListener("click", () => doLogout());
    navigate("dashboard");
}

document.addEventListener("DOMContentLoaded", async () => {
    // Apply stored theme
    try {
        const t = localStorage.getItem("psb_theme") || "light";
        document.documentElement.setAttribute("data-theme", t);
    } catch {}

    // Check session
    try {
        const res = await fetch("/api/session");
        const body = (await res.json()) as { authed: boolean; user?: string; role?: UserRole };
        if (body.authed) {
            ($("#loginScreen") as HTMLElement).hidden = true;
            ($("#adminApp") as HTMLElement).hidden = false;
            await bootApp();
            return;
        }
    } catch {}
    mountLogin();
});
