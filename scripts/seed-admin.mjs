#!/usr/bin/env node
/**
 * Emergency seed/reset script for the admin panel.
 *
 * Usage:
 *   node scripts/seed-admin.mjs <username> <password> [admin|editor]
 *
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN in the environment.
 * Use it to seed the first admin if the env-based bootstrap fails, or to
 * reset the password of an existing user when you've been locked out.
 */
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.error("Missing KV_REST_API_URL / KV_REST_API_TOKEN.");
    process.exit(1);
}

const username = process.argv[2];
const password = process.argv[3];
const roleArg = process.argv[4] ?? "admin";

if (!username || !password) {
    console.error("Usage: node scripts/seed-admin.mjs <username> <password> [admin|editor]");
    process.exit(1);
}

if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
    console.error("Invalid username (3-32 chars, alphanumeric, _ or -).");
    process.exit(1);
}
if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
}

const role = roleArg === "editor" ? "editor" : "admin";

const { kv } = await import("@vercel/kv");

const userKey = `psb:user:${username}`;
const indexKey = "psb:users:index";

const existing = await kv.get(userKey);

const salt = randomBytes(16);
const hash = await scryptAsync(password, salt, 64);
const now = Date.now();

const user = {
    username,
    passwordHash: hash.toString("hex"),
    salt: salt.toString("hex"),
    role,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sessionEpoch: now,
};

await kv.set(userKey, user);
await kv.sadd(indexKey, username);

console.log(
    existing
        ? `[seed-admin] User "${username}" updated (role=${role}, sessions invalidated).`
        : `[seed-admin] User "${username}" created (role=${role}).`,
);
