import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImageMagick, initializeImageMagick, MagickFormat } from "npm:@imagemagick/magick-wasm@0.0.46";

const wasm = await Deno.readFile(new URL("magick.wasm", import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.46")));
await initializeImageMagick(wasm);

const MAX_BYTES = 8 * 1024 * 1024;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-visual-upload-ticket",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const hex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
const digest = async (v: string | Uint8Array) => hex(new Uint8Array(await crypto.subtle.digest(
  "SHA-256", typeof v === "string" ? new TextEncoder().encode(v) : v,
)));
const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));

function imageType(b: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (b.length < 16 || b.length > MAX_BYTES) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && String.fromCharCode(...b.slice(1, 4)) === "PNG") return "png";
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.slice(8, 12)) === "WEBP" &&
      new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(4, true) + 8 === b.length) return "webp";
  return null;
}
async function toWebp(input: Uint8Array): Promise<Uint8Array> {
  return await new Promise((resolve, reject) => {
    ImageMagick.read(input, async image => {
      try {
        if (image.width < 1 || image.height < 1 || image.width * image.height > 40000000) {
          reject(new Error("unsafe-dimensions")); return;
        }
        if (image.width > 2560 || image.height > 2560) image.resize(2560, 2560);
        image.quality = 82;
        await image.write(MagickFormat.Webp, data => resolve(new Uint8Array(data)));
      } catch (e) { reject(e); }
    });
  });
}
function isAdmin(user: any) {
  const role = user?.app_metadata?.role;
  const modules = user?.app_metadata?.admin_modules;
  return role === "admin" || (role === "site_admin" && Array.isArray(modules) && modules.includes("visual-assets"));
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST only" }, 405);

  const authHeader = req.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authHeader)) return reply({ error: "Login required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return reply({ error: "Server configuration unavailable" }, 503);

  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(authHeader.slice(7));
  const user = authData?.user;
  if (authError || !user) return reply({ error: "Invalid session" }, 401);
  if (!isAdmin(user)) return reply({ error: "Visual asset administrator access required" }, 403);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  if ((req.headers.get("content-type") || "").includes("application/json")) {
    let body: any;
    try { body = await req.json(); } catch { return reply({ error: "Invalid JSON" }, 400); }
    if (body?.action !== "issue_ticket") return reply({ error: "Unsupported action" }, 400);
    const key = typeof body.asset_key === "string" ? body.asset_key.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!/^[a-z0-9][a-z0-9._-]{2,100}$/i.test(key) || !title || title.length > 160) {
      return reply({ error: "Invalid asset key or title" }, 400);
    }
    const { data: existing, error: lookupError } = await admin.from("visual_asset_catalog")
      .select("asset_key").eq("asset_key", key).maybeSingle();
    if (lookupError) return reply({ error: "Catalog lookup failed" }, 503);
    if (existing) return reply({ error: "Asset key already exists" }, 409);

    const ticket = randomToken();
    const objectPath = `imports/${key}/${crypto.randomUUID()}.webp`;
    const { error } = await admin.rpc("create_visual_import_ticket", {
      p_ticket_hash: await digest(ticket), p_asset_key: key, p_object_path: objectPath,
      p_title: title, p_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (error) return reply({ error: "Could not create one-time upload ticket" }, 503);
    return reply({ ok: true, ticket, expires_in: 900, asset_key: key }, 201);
  }

  const ticket = req.headers.get("x-visual-upload-ticket") || "";
  if (!/^[a-f0-9]{64}$/.test(ticket)) return reply({ error: "One-time upload ticket required" }, 401);
  let form: FormData;
  try { form = await req.formData(); } catch { return reply({ error: "Multipart form required" }, 400); }
  const file = form.get("file");
  if (!(file instanceof File)) return reply({ error: "Image file required" }, 400);
  if (file.size <= 0 || file.size > MAX_BYTES) return reply({ error: "Image must be between 1 byte and 8 MB" }, 413);
  const source = new Uint8Array(await file.arrayBuffer());
  const format = imageType(source);
  if (!format) return reply({ error: "Only valid JPEG, PNG or WebP images are accepted" }, 415);

  const { data, error: ticketError } = await admin.rpc("consume_visual_upload_ticket", {
    p_ticket_hash: await digest(ticket),
  });
  const record = Array.isArray(data) ? data[0] : null;
  if (ticketError || !record) return reply({ error: "Ticket invalid, expired or already used" }, 401);

  let output: Uint8Array;
  try { output = await toWebp(source); }
  catch (e) {
    return reply({ error: e instanceof Error && e.message === "unsafe-dimensions"
      ? "Image dimensions exceed safe processing limits" : "Image conversion failed" }, 422);
  }
  if (output.length < 16 || output.length > MAX_BYTES ||
      String.fromCharCode(...output.slice(0, 4)) !== "RIFF" ||
      String.fromCharCode(...output.slice(8, 12)) !== "WEBP" ||
      new DataView(output.buffer, output.byteOffset, output.byteLength).getUint32(4, true) + 8 !== output.length) {
    return reply({ error: "WebP validation failed" }, 500);
  }

  const sha256 = await digest(output);
  const { error: uploadError } = await admin.storage.from("visual-drafts").upload(record.object_path, output, {
    contentType: "image/webp", cacheControl: "31536000", upsert: false,
  });
  if (uploadError) return reply({ error: "Private storage upload failed" }, 503);

  const { error: registryError } = await admin.from("visual_asset_catalog").insert({
    asset_key: record.asset_key, title: record.title, object_path: record.object_path,
    bucket: "visual-drafts", mime_type: "image/webp", byte_size: output.length,
    sha256, status: "draft", published_at: null,
    metadata: { transport: "leon-direct-upload", source_format: format, validation: "signature+webp+sha256", uploaded_by: user.id },
  });
  if (registryError) {
    await admin.storage.from("visual-drafts").remove([record.object_path]);
    return reply({ error: "Catalog write failed; object rolled back" }, 503);
  }
  return reply({ ok: true, status: "draft", asset_key: record.asset_key,
    mime_type: "image/webp", bytes: output.length, sha256, next_step: "review-and-publish" }, 201);
});
