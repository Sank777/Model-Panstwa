import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImageMagick, initializeImageMagick, MagickFormat } from "npm:@imagemagick/magick-wasm@0.0.46";

const wasmBytes = await Deno.readFile(new URL("magick.wasm", import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.46")));
await initializeImageMagick(wasmBytes);

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const ALLOWED_HOSTS = new Set(["dl.dropboxusercontent.com", "content.dropboxapi.com", "www.dropbox.com"]);
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

function safeDropboxUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.length > 4096) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname) ||
        u.username || u.password || u.port || u.hash) return null;
    return u;
  } catch { return null; }
}
function sourceImageType(b: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (b.length < 16 || b.length > MAX_BYTES) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && String.fromCharCode(...b.slice(1, 4)) === "PNG") return "png";
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.slice(8, 12)) === "WEBP" &&
      new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(4, true) + 8 === b.length) return "webp";
  return null;
}
async function convertToWebp(input: Uint8Array): Promise<Uint8Array> {
  return await new Promise((resolve, reject) => {
    ImageMagick.read(input, async image => {
      try {
        if (image.width < 1 || image.height < 1 || image.width * image.height > 40000000) {
          reject(new Error("image-dimensions"));
          return;
        }
        if (image.width > 2560 || image.height > 2560) image.resize(2560, 2560);
        image.quality = 82;
        await image.write(MagickFormat.Webp, data => resolve(new Uint8Array(data)));
      } catch (error) { reject(error); }
    });
  });
}
async function readLimited(r: Response): Promise<Uint8Array> {
  const n = Number(r.headers.get("content-length") || 0);
  if (n > MAX_BYTES) throw new Error("too-large");
  if (!r.body) throw new Error("empty");
  const reader = r.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { await reader.cancel(); throw new Error("too-large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}
async function fetchDropbox(initial: URL): Promise<Uint8Array> {
  let current = initial;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const r = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    if (r.status >= 300 && r.status < 400) {
      const location = r.headers.get("location");
      await r.body?.cancel();
      if (!location || hop === MAX_REDIRECTS) throw new Error("redirect");
      const next = safeDropboxUrl(new URL(location, current).toString());
      if (!next) throw new Error("unsafe-redirect");
      current = next;
      continue;
    }
    if (!r.ok) throw new Error("upstream");
    const type = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (type && type !== "image/webp" && type !== "image/jpeg" && type !== "image/png" && type !== "application/octet-stream") {
      await r.body?.cancel();
      throw new Error("content-type");
    }
    return await readLimited(r);
  }
  throw new Error("redirect");
}
function hex(bytes: Uint8Array) {
  return Array.from(bytes, v => v.toString(16).padStart(2, "0")).join("");
}
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, v => v.toString(16).padStart(2, "0")).join("");
}
async function digest(value: string | Uint8Array) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",
    typeof value === "string" ? new TextEncoder().encode(value) : value)));
}
Deno.serve(async req => {
  if (req.method !== "POST") return reply({ error: "POST only" }, 405);
  const bridgeSecret = Deno.env.get("LEON_VISUAL_BRIDGE_SECRET") || "";
  const suppliedSecret = req.headers.get("x-leon-bridge-secret") || "";
  if (!bridgeSecret || suppliedSecret.length !== bridgeSecret.length) {
    return reply({ error: "Bridge authentication unavailable" }, 503);
  }
  let secretDiff = 0;
  for (let i = 0; i < bridgeSecret.length; i++) secretDiff |= bridgeSecret.charCodeAt(i) ^ suppliedSecret.charCodeAt(i);
  if (secretDiff !== 0) return reply({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const bearer = req.headers.get("authorization") || "";
  if (!supabaseUrl || !anonKey || !serviceKey || !/^Bearer\s+\S+$/i.test(bearer)) {
    return reply({ error: "Authentication or server configuration unavailable" }, 401);
  }
  const auth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer.slice(7));
  const user = authData?.user;
  if (authError || !user) return reply({ error: "Invalid session" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch { return reply({ error: "Invalid JSON" }, 400); }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const action = body.action;

  if (action === "issue_ticket") {
    const role = user.app_metadata?.role;
    const modules = Array.isArray(user.app_metadata?.admin_modules) ? user.app_metadata.admin_modules : [];
    if (!(role === "admin" || (role === "site_admin" && modules.includes("visual-assets")))) {
      return reply({ error: "Visual asset administrator access required" }, 403);
    }
    const key = typeof body.asset_key === "string" ? body.asset_key.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!/^[a-z0-9][a-z0-9._-]{2,100}$/i.test(key) || !title || title.length > 160) {
      return reply({ error: "Invalid asset key or title" }, 400);
    }
    const { data: existing, error: lookupError } = await admin.from("visual_asset_catalog")
      .select("asset_key").eq("asset_key", key).maybeSingle();
    if (lookupError) return reply({ error: "Catalog lookup failed" }, 503);
    if (existing) return reply({ error: "Asset key already exists" }, 409);

    const token = randomToken();
    const tokenHash = await digest(token);
    const objectPath = `imports/${key}/${crypto.randomUUID()}.webp`;
    const { error: insertError } = await admin.rpc("create_visual_import_ticket", {
      p_ticket_hash: tokenHash, p_asset_key: key, p_object_path: objectPath, p_title: title,
      p_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
    if (insertError) return reply({ error: "Could not create one-time import ticket" }, 503);
    return reply({ ok: true, ticket: token, expires_in: 900, asset_key: key }, 201);
  }

  if (action !== "import") return reply({ error: "Unsupported action" }, 400);
  const ticket = req.headers.get("x-leon-import-ticket") || "";
  if (!/^[a-f0-9]{64}$/.test(ticket)) return reply({ error: "One-time import ticket required" }, 401);
  const url = safeDropboxUrl(body.download_url);
  if (!url) return reply({ error: "Invalid Dropbox URL" }, 400);

  const ticketHash = await digest(ticket);
  const { data, error: ticketError } = await admin.rpc("consume_visual_upload_ticket", { p_ticket_hash: ticketHash });
  const record = Array.isArray(data) ? data[0] : null;
  if (ticketError || !record) return reply({ error: "Ticket invalid, expired or already used" }, 401);

  let bytes: Uint8Array;
  try {
    bytes = await fetchDropbox(url);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "upstream";
    const status = reason === "too-large" ? 413 : reason === "content-type" ? 415 : 502;
    return reply({ error: reason === "too-large" ? "File exceeds 8 MB" :
      reason === "content-type" ? "Dropbox response is not a supported image" :
      "Dropbox download failed or returned an unsafe redirect" }, status);
  }
  const inputType = sourceImageType(bytes);
  if (!inputType) return reply({ error: "Only valid JPEG, PNG or WebP images up to 8 MB are accepted" }, 415);
  try {
    bytes = await convertToWebp(bytes);
  } catch (e) {
    const reason = e instanceof Error && e.message === "image-dimensions" ? "Image dimensions exceed the safe processing limit" : "Image conversion failed";
    return reply({ error: reason }, 422);
  }
  if (bytes.length < 16 || bytes.length > MAX_BYTES ||
      String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
      String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP" ||
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) + 8 !== bytes.length) {
    return reply({ error: "WebP encoder returned invalid output" }, 500);
  }

  const sha256 = await digest(bytes);
  const objectPath = `imports/${record.asset_key}/${sha256}.webp`;
  const { error: uploadError } = await admin.storage.from("visual-drafts").upload(objectPath, bytes, {
    contentType: "image/webp", cacheControl: "31536000", upsert: false
  });
  if (uploadError) return reply({ error: "Private storage upload failed" }, 503);

  const { error: insertError } = await admin.from("visual_asset_catalog").insert({
    asset_key: record.asset_key, title: record.title, object_path: objectPath,
    bucket: "visual-drafts", mime_type: "image/webp", byte_size: bytes.length,
    sha256, status: "draft", published_at: null,
    metadata: { transport: "dropbox-importer", validation: "jpeg-png-webp-to-webp+sha256", source_format: inputType,
      source_host: url.hostname, imported_by: user.id }
  });
  if (insertError) {
    await admin.storage.from("visual-drafts").remove([objectPath]);
    return reply({ error: "Catalog insert failed; storage object rolled back" }, 503);
  }
  return reply({ ok: true, asset_key: record.asset_key, status: "draft",
    mime_type: "image/webp", bytes: bytes.length, sha256, object_path: objectPath }, 201);
});