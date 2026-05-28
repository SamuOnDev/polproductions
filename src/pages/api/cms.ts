import type { APIRoute } from "astro";
import { isAuthed } from "../../lib/session";
import { loadCms, saveCms } from "../../lib/cms-store";
import type { CmsData } from "../../lib/cms-types";

export const prerender = false;

export const GET: APIRoute = async () => {
    const data = await loadCms();
    return json(data);
};

export const PUT: APIRoute = async ({ request, cookies }) => {
    if (!isAuthed(cookies)) return json({ ok: false, error: "No autorizado" }, 401);
    let body: CmsData;
    try {
        body = (await request.json()) as CmsData;
    } catch {
        return json({ ok: false, error: "JSON inválido" }, 400);
    }
    if (!body || typeof body !== "object" || !Array.isArray(body.projects) || !body.images) {
        return json({ ok: false, error: "Estructura del CMS incompleta" }, 400);
    }
    await saveCms(body);
    return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
    });
}
