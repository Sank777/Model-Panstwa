import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_HOSTS = new Set(["dl.dropboxusercontent.com", "content.dropboxapi.com"]);
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
function imageType(b: Uint8Array): { mime: string; ext: string } | null {
  if (b.length < 16 || b.length > MAX_BYTES) return null;
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 137 && String.fromCharCode(...b.slice(1,4)) === "PNG") return { mime: "image/png", ext: "png" };
  if (String.fromCharCode(...b.slice(0,4)) === "RIFF" && String.fromCharCode(...b.slice(8,12)) === "WEBP") {
    const size = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(4, true) + 8;
    if (size === b.length) return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
async function readLimited(r: Response): Promise<Uint8Array> {
  const n = Number(r.headers.get("content-length") || 0);
  if (n > MAX_BYTES) throw new Error("too-large");
  if (!r.body) throw new Error("empty");
  const reader = r.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const {done,value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { await reader.cancel(); throw new Error("too-large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const out = new Uint8Array(total); let offset = 0;
  for (const c of chunks) { out.set(c,offset); offset += c.length; }
  return out;
}
Deno.serve(async req => {
  if (req.method !== "POST") return reply({error:"POST only"},405);
  let body: Record<string,unknown>;
  try { body = await req.json(); } catch { return reply({error:"Invalid JSON"},400); }
  const url = safeDropboxUrl(body.download_url);
  const key = typeof body.asset_key === "string" ? body.asset_key : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0,160) : "";
  if (!url || !/^[a-z0-9][a-z0-9._-]{2,100}$/i.test(key) || !title)
    return reply({error:"Invalid Dropbox URL or metadata"},400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return reply({error:"Server configuration unavailable"},503);
  const admin = createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:existing,error:lookupError} = await admin.from("visual_asset_catalog")
    .select("asset_key").eq("asset_key",key).maybeSingle();
  if (lookupError) return reply({error:"Catalog lookup failed"},503);
  if (existing) return reply({error:"Asset key already exists"},409);

  let bytes: Uint8Array;
  try {
    const r = await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(20000)});
    if (r.status >= 300 && r.status < 400) return reply({error:"Dropbox redirect rejected"},422);
    if (!r.ok) return reply({error:"Dropbox download failed",upstream_status:r.status},502);
    bytes = await readLimited(r);
  } catch(e) {
    return reply({error:e instanceof Error && e.message === "too-large" ? "File exceeds 8 MB" : "Dropbox download failed"},
      e instanceof Error && e.message === "too-large" ? 413 : 502);
  }
  const type = imageType(bytes);
  if (!type) return reply({error:"Invalid or unsupported image signature"},415);
  const hash = await crypto.subtle.digest("SHA-256",bytes);
  const sha256 = Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,"0")).join("");
  const objectPath = `${key}/${sha256}.${type.ext}`;
  const {error:uploadError} = await admin.storage.from("visual-drafts").upload(objectPath,bytes,{
    contentType:type.mime,cacheControl:"31536000",upsert:false
  });
  if (uploadError) return reply({error:"Private storage upload failed"},503);
  const {error:insertError} = await admin.from("visual_asset_catalog").insert({
    asset_key:key,title,object_path:objectPath,bucket:"visual-drafts",mime_type:type.mime,
    byte_size:bytes.length,sha256,status:"draft",published_at:null,
    metadata:{transport:"dropbox-importer",validation:"signature+size+sha256",source_host:url.hostname}
  });
  if (insertError) {
    await admin.storage.from("visual-drafts").remove([objectPath]);
    return reply({error:"Catalog insert failed; storage object rolled back"},503);
  }
  return reply({ok:true,asset_key:key,status:"draft",mime_type:type.mime,bytes:bytes.length,sha256,object_path:objectPath},201);
});
