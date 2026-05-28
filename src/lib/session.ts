import { createHmac, timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";

const COOKIE_NAME = "psb_admin";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
    const s = process.env.SESSION_SECRET;
    if (!s || s.length < 16) {
        throw new Error("SESSION_SECRET is missing or too short. Set it in .env.local (>= 32 hex chars).");
    }
    return s;
}

function sign(payload: string): string {
    return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
}

export function issueSession(cookies: AstroCookies, user: string): void {
    const issued = Date.now();
    const payload = `${user}.${issued}`;
    const sig = sign(payload);
    cookies.set(COOKIE_NAME, `${payload}.${sig}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: import.meta.env.PROD,
        path: "/",
        maxAge: TTL_SECONDS,
    });
}

export function clearSession(cookies: AstroCookies): void {
    cookies.delete(COOKIE_NAME, { path: "/" });
}

export function isAuthed(cookies: AstroCookies): boolean {
    const raw = cookies.get(COOKIE_NAME)?.value;
    if (!raw) return false;
    const parts = raw.split(".");
    if (parts.length !== 3) return false;
    const [user, issuedStr, sig] = parts;
    if (!user || !issuedStr || !sig) return false;
    const issued = Number(issuedStr);
    if (!Number.isFinite(issued)) return false;
    if (Date.now() - issued > TTL_SECONDS * 1000) return false;
    const expected = sign(`${user}.${issuedStr}`);
    return safeEqual(expected, sig);
}

export function checkCredentials(user: string, pass: string): boolean {
    const expectedUser = process.env.ADMIN_USER;
    const expectedPass = process.env.ADMIN_PASSWORD;
    if (!expectedUser || !expectedPass) return false;
    return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}
