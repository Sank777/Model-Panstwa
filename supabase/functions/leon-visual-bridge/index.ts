import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_BYTES = 8 * 1024 * 1024;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-content-sha256",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function validWebp(bytes: Uint8Array) {
  return bytes.length >= 16 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" &&
    bytes.length <= MAX_BYTES;
}

function dimensions(bytes: Uint8Array) {
  const kind = String.fromCharCode(...bytes.slice(12, 16));
  if (kind === "VP8X" && bytes.length >= 30) {
    const u24 = (i: number) => bytes[i] + (bytes[i + 1] << 8) + (bytes[i + 2] << 16);
    return { width: 1 + u24(24), height: 1 + u24(27) };
  }
  return { width: null, height: null };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST only" }, 405);

  const ticket = req.headers.get("authorization")?.match(/^Bearer\\s+([A-Za-z0-9_-]{32,100})$/)?.[1];
  if (!ticket) return reply({ error: "Upload ticket required" }, 401);

  const length = Number(req.headers.get("content-length") || "0");
  if (!Number.isFinite(length) || length <= 0 || length > MAX_BYTES) {
    return reply({ error: "Invalid content length" }, 413);
  }

  const bytes = new Uint8Array(await req.arrayBuffer());
  if (!validWebp(bytes)) return reply({ error: "Only valid WebP files up to 8 MB are accepted" }, 415);

  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, "0")).join("");
  const expected = req.headers.get("x-content-sha256");
  if (expected && expected !== sha256) return reply({ error: "SHA-256 mismatch" }, 422);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return reply({ error: "Server configuration unavailable" }, 503);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ticketDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ticket));
  const ticketHash = Array.from(new Uint8Array(ticketDigest), v => v.toString(16).padStart(2, "0")).join("");
  const { data, error: ticketError } = await admin.rpc("consume_visual_upload_ticket", {
    p_ticket_hash: ticketHash,
  });
  const record = Array.isArray(data) ? data[0] : null;
  if (ticketError || !record) return reply({ error: "Upload ticket invalid, expired or already used" }, 401);

  const { width, height } = dimensions(bytes);
  const { error: uploadError } = await admin.storage.from("visual-assets").upload(record.object_path, bytes, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return reply({ error: "Storage upload failed" }, 503);

  const { error: registryError } = await admin.from("visual_asset_catalog").insert({
    asset_key: record.asset_key,
    title: record.title,
    object_path: record.object_path,
    mime_type: "image/webp",
    byte_size: bytes.byteLength,
    width,
    height,
    sha256,
    status: "published",
    published_at: new Date().toISOString(),
    metadata: { transport: "leon-visual-bridge", verification: "webp-signature+sha256" },
  });

  if (registryError) {
    await admin.storage.from("visual-assets").remove([record.object_path]);
    return reply({ error: "Registry write failed; uploaded object rolled back" }, 503);
  }

  const publicUrl = supabaseUrl + "/storage/v1/object/public/visual-assets/" +
    record.object_path.split("/").map(encodeURIComponent).join("/");
  return reply({
    ok: true,
    asset_key: record.asset_key,
    public_url: publicUrl,
    bytes: bytes.byteLength,
    sha256,
    width,
    height,
  }, 201);
});
