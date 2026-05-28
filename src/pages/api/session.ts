import type { APIRoute } from "astro";
import { isAuthed } from "../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
    return new Response(JSON.stringify({ authed: isAuthed(cookies) }), {
        headers: { "content-type": "application/json" },
    });
};
