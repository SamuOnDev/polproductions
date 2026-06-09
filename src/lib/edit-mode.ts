import type { AstroCookies } from "astro";
import { getSession } from "./session";

/**
 * Visual edit mode flag for public pages.
 *
 * True ONLY when the request has `?cmsedit=1` AND a valid admin session. Anonymous
 * visitors never get the edit markers (data-cms-key / data-cms-slot), even with the
 * query param. Pages use it to conditionally emit those attributes; the /admin "Editar
 * web" view loads pages with `?cmsedit=1` inside an iframe.
 */
export async function isEditMode(cookies: AstroCookies, url: URL): Promise<boolean> {
    if (url.searchParams.get("cmsedit") !== "1") return false;
    return (await getSession(cookies)).authed;
}
