/* =====================================================
 * Pol Sánchez Baena — Admin SPA logic
 * Adapted from the mockup `admin.js`. Uses the server API
 * (/api/cms, /api/upload, /api/login, /api/logout) instead
 * of localStorage.
 * ===================================================== */
import type { CmsData, Project, ProjectType, HorizontalSize } from "../lib/cms-types";

type Route = "dashboard" | "proyectos" | "imagenes" | "ajustes";

const $ = <T extends Element = Element>(s: string, root: ParentNode = document) =>
    root.querySelector(s) as T | null;
const $$ = <T extends Element = Element>(s: string, root: ParentNode = document) =>
    Array.from(root.querySelectorAll(s)) as T[];

let cms: CmsData = { images: {}, projects: [] };
let currentRoute: Route = "dashboard";
let projectFilter: "horizontal" | "vertical" | "all" = "horizontal";

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

async function uploadFile(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
        alert(body.error || "Error al subir la imagen");
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
const ROUTES: Record<Route, { title: string; render: (root: HTMLElement) => void }> = {
    dashboard: { title: "Resumen", render: renderDashboard },
    proyectos: { title: "Proyectos", render: renderProyectos },
    imagenes: { title: "Imágenes", render: renderImagenes },
    ajustes: { title: "Ajustes", render: renderAjustes },
};

function navigate(route: Route) {
    if (!ROUTES[route]) route = "dashboard";
    currentRoute = route;
    $$<HTMLElement>(".side-link").forEach((l) => l.classList.toggle("active", l.dataset.route === route));
    ($("#crumb") as HTMLElement).textContent = ROUTES[route].title;
    ($("#pageTitle") as HTMLElement).textContent = ROUTES[route].title;
    const content = $("#content") as HTMLElement;
    content.innerHTML = "";
    ROUTES[route].render(content);
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
                <span class="l">Imágenes globales</span>
                <span class="n"><b>${Object.keys(cms.images).length}</b></span>
                <span class="l">Hero · Retrato</span>
            </div>
        </div>
        <div class="section-card">
            <h3>Acciones rápidas <small>atajos</small></h3>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn solid" data-go="proyectos">+ Nuevo proyecto</button>
                <button class="btn ghost" data-go="imagenes">Imágenes</button>
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

/* ── IMÁGENES ─────────────────────────────────────────── */
function renderImagenes(root: HTMLElement) {
    root.innerHTML = `
        <div class="section-card">
            <h3>Imágenes globales <small>hero · retrato</small></h3>
            <div class="row2" id="globalImgs"></div>
        </div>
        <div class="section-card">
            <h3>Portadas de proyectos <small>${cms.projects.length} proyectos</small></h3>
            <div class="img-grid" id="projImgs"></div>
        </div>
    `;
    const globals = [
        { key: "hero.showreel", label: "Portada del showreel (hero)" },
        { key: "about.portrait", label: "Retrato de la sección About" },
    ];
    const gWrap = root.querySelector("#globalImgs") as HTMLElement;
    globals.forEach((g) => {
        const src = cms.images[g.key] || "";
        const div = document.createElement("div");
        div.className = "field";
        div.innerHTML = `
            <label>${g.label} <i>${g.key}</i></label>
            <div class="img-picker">
                <div class="preview">${src ? `<img src="${escapeHtml(src)}" alt="">` : "Sin imagen"}</div>
                <div class="pick">
                    <input type="file" accept="image/*" id="gf-${g.key.replace(/\W/g, "_")}" />
                    <label for="gf-${g.key.replace(/\W/g, "_")}" class="file-btn">📷 Subir</label>
                    <input type="text" value="${escapeHtml(src)}" data-globkey="${g.key}" placeholder="URL pública" />
                </div>
            </div>
        `;
        gWrap.appendChild(div);
        const fileInput = div.querySelector(`#gf-${g.key.replace(/\W/g, "_")}`) as HTMLInputElement;
        const textInput = div.querySelector("[data-globkey]") as HTMLInputElement;
        const preview = div.querySelector(".preview") as HTMLElement;
        fileInput.addEventListener("change", async () => {
            const f = fileInput.files?.[0];
            if (!f) return;
            const uploaded = await uploadFile(f);
            if (!uploaded) return;
            cms.images[g.key] = uploaded;
            textInput.value = uploaded;
            preview.innerHTML = `<img src="${uploaded}" alt="">`;
            await persist();
        });
        textInput.addEventListener("change", async () => {
            cms.images[g.key] = textInput.value;
            preview.innerHTML = textInput.value ? `<img src="${escapeHtml(textInput.value)}" alt="">` : "Sin imagen";
            await persist();
        });
    });

    const pWrap = root.querySelector("#projImgs") as HTMLElement;
    if (!cms.projects.length) {
        pWrap.innerHTML = '<div class="empty-state"><p>Aún no hay proyectos.</p></div>';
    } else {
        cms.projects.forEach((p) => {
            const card = document.createElement("div");
            card.className = "img-card";
            card.style.cursor = "pointer";
            card.innerHTML = `
                <div class="ph">${p.cover ? `<img src="${escapeHtml(p.cover)}" alt="">` : ""}</div>
                <div class="info"><b>${escapeHtml(p.title || "Sin título")}</b><span>${p.type} · ${escapeHtml(p.subtitle || "")}</span></div>
            `;
            card.addEventListener("click", () => openProjectDrawer(p.id));
            pWrap.appendChild(card);
        });
    }
}

/* ── AJUSTES ──────────────────────────────────────────── */
function renderAjustes(root: HTMLElement) {
    root.innerHTML = `
        <div class="section-card">
            <h3>Sesión <small>credenciales en .env</small></h3>
            <p style="font-size:13px;color:var(--muted);margin-bottom:14px">El usuario y la contraseña están en las variables de entorno del servidor (<b style="color:var(--ink);font-family:'Roboto Mono',monospace">ADMIN_USER</b>, <b style="color:var(--ink);font-family:'Roboto Mono',monospace">ADMIN_PASSWORD</b>). Para cambiarlas, actualiza el <b>.env</b> y redeploy.</p>
            <button class="btn ghost" id="logoutBtn2">Cerrar sesión</button>
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
}

async function bootApp() {
    await loadCmsFromServer();
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
        const body = (await res.json()) as { authed: boolean };
        if (body.authed) {
            ($("#loginScreen") as HTMLElement).hidden = true;
            ($("#adminApp") as HTMLElement).hidden = false;
            await bootApp();
            return;
        }
    } catch {}
    mountLogin();
});
