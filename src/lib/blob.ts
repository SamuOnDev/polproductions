/**
 * Resolve the Vercel Blob read-write token.
 *
 * When a project has more than one Blob store connected, Vercel prefixes the injected
 * env vars (e.g. BLOB_MEDIA_READ_WRITE_TOKEN). We check the standard name first and then
 * known prefixed names, so uploads keep working regardless of the store naming.
 *
 * IMPORTANT: only ONE Blob store should stay connected, and it MUST be a PUBLIC store
 * (the site shows images via public URLs). A private store rejects public uploads with
 * "Cannot use public access on a private store". If a private store is also connected it
 * provides the standard BLOB_READ_WRITE_TOKEN and would win here — keep only the public one.
 */
export function blobToken(): string | undefined {
    return (
        process.env.BLOB_READ_WRITE_TOKEN ||
        process.env.BLOB_MEDIA_READ_WRITE_TOKEN ||
        undefined
    );
}
