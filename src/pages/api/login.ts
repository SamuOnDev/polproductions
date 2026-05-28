import type { APIRoute } from "astro";
import { checkCredentials, issueSession } from "../../lib/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    let body: { user?: string; pass?: string };
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: "Invalid body" }, 400);
    }
    const user = (body.user ?? "").trim();
    const pass = body.pass ?? "";
    if (!user || !pass) return json({ ok: false, error: "Faltan credenciales" }, 400);
    if (!checkCredentials(user, pass)) {
        return json({ ok: false, error: "Usuario o contraseña incorrectos" }, 401);
    }
    issueSession(cookies, user);
    return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
    });
}
