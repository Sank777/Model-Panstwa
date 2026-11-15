import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = "https://sank777.github.io";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function readBodyLimited(req: Request, maxBytes: number): Promise<Uint8Array> {
  if (req.body === null) return new Uint8Array();
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

async function hashClientIp(ip: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function parseBearerHeader(value: string | null): { token: string | null; invalid: boolean } {
  if (value === null || value.trim() === "") return { token: null, invalid: false };
  const match = value.match(/^Bearer\\s+([^\\s]+)$/i);
  return match ? { token: match[1], invalid: false } : { token: null, invalid: true };
}

function validImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (mime === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && origin !== allowedOrigin) return new Response("Forbidden origin", { status: 403 });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/json")) {
    return reply({ error: "Content-Type must be multipart/form-data or application/json" }, 415);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return reply({ error: "Server configuration is incomplete" }, 500);

  // Trust only Cloudflare's edge-provided client IP; never accept client-controlled forwarding headers.
  // Optional account linking: the user ID is always derived from a verified access token.
  let submitterUserId: string | null = null;
  const authorization = req.headers.get("authorization");
  const parsedAuthorization = parseBearerHeader(authorization);
  const bearer = parsedAuthorization.token;
  if (parsedAuthorization.invalid) return reply({ error: "Invalid authorization header" }, 401);
  if (bearer) {
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(bearer);
    if (authError || !authData.user) return reply({ error: "Invalid session" }, 401);
    submitterUserId = authData.user.id;
  }

  const clientIp = req.headers.get("cf-connecting-ip");
  if (!clientIp) return reply({ error: "Unable to verify request source" }, 400);

  const ipHash = await hashClientIp(clientIp, serviceKey);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: allowed, error: limitError } = await admin.rpc("consume_report_rate_limit", {
    p_ip_hash: ipHash, p_limit: 5, p_window_seconds: 3600,
  });
  if (limitError) {
    console.error("submit-report rate limiter failed:", limitError.message);
    return reply({ error: "Submission temporarily unavailable" }, 503);
  }
  if (allowed !== true) return reply({ error: "Limit 5 zgłoszeń na godzinę został osiągnięty. Spróbuj później." }, 429);

  let body: Record<string, unknown>;
  let photo: File | null = null;

  try {
    const rawBody = await readBodyLimited(req, 6 * 1024 * 1024);
    const boundedRequest = new Request(req.url, { method: "POST", headers: req.headers, body: rawBody });
    if (contentType.includes("multipart/form-data")) {
      const form = await boundedRequest.formData();
      body = Object.fromEntries(form.entries()) as Record<string, unknown>;
      const uploaded = form.get("photo");
      if (uploaded instanceof File && uploaded.size > 0) photo = uploaded;
    } else if (contentType.includes("application/json")) {
      const raw = new TextDecoder().decode(rawBody);
      if (raw.length > 12000) return reply({ error: "Request too large" }, 413);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid JSON");
      body = parsed as Record<string, unknown>;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return reply({ error: message }, message === "Request too large" ? 413 : 400);
  }

  if (typeof body.website === "string" && body.website.trim() !== "") return reply({ accepted: true });

  const category = typeof body.category === "string" ? body.category.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const allowedCategories = ["Drogi i infrastruktura", "Oświetlenie", "Śmieci / czystość", "Bezpieczeństwo", "Urząd / administracja", "Zieleń i środowisko", "Inne"];

  if (!allowedCategories.includes(category)) return reply({ error: "Invalid category" }, 400);
  if (!description || description.length > 2000) return reply({ error: "Description must contain 1–2000 characters" }, 400);
  if (location.length > 160) return reply({ error: "Location is too long" }, 400);

  let lat: number | null = null;
  let lng: number | null = null;
  if (body.lat !== null && body.lat !== undefined && body.lat !== "" && body.lng !== null && body.lng !== undefined && body.lng !== "") {
    const parsedLat = Number(body.lat);
    const parsedLng = Number(body.lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return reply({ error: "Invalid coordinates" }, 400);
    }
    lat = parsedLat;
    lng = parsedLng;
  } else if ((body.lat !== null && body.lat !== undefined && body.lat !== "") || (body.lng !== null && body.lng !== undefined && body.lng !== "")) {
    return reply({ error: "Both coordinates must be provided together" }, 400);
  }

  if (photo) {
    if (photo.size > 5 * 1024 * 1024) return reply({ error: "Zdjęcie może mieć maksymalnie 5 MB." }, 413);
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) return reply({ error: "Dozwolone formaty zdjęć: JPG, PNG lub WebP." }, 415);
    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!validImageSignature(bytes, photo.type)) return reply({ error: "Plik nie jest prawidłowym obrazem JPG, PNG lub WebP." }, 415);
  }


  const reportId = crypto.randomUUID();
  let photoPath: string | null = null;
  let photoUrl: string | null = null;

  if (photo) {
    const extension = photo.type === "image/jpeg" ? "jpg" : photo.type === "image/png" ? "png" : "webp";
    photoPath = `reports/${reportId}.${extension}`;
    const { error: uploadError } = await admin.storage.from("zgloszenia-zdjecia").upload(photoPath, photo, {
      contentType: photo.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      console.error("submit-report photo upload failed:", uploadError.message);
      return reply({ error: "Nie udało się zapisać zdjęcia." }, 500);
    }
    photoUrl = admin.storage.from("zgloszenia-zdjecia").getPublicUrl(photoPath).data.publicUrl;
  }

  const { data, error } = await admin.from("zgloszenia").insert({
    id: reportId,
    user_id: submitterUserId,
    time: Date.now(),
    category,
    description,
    location,
    lat,
    lng,
    status: "nowe",
    priority: "normalny",
    comment: null,
    photo: photoUrl,
    supports: 0,
    moderation_status: "oczekuje",
  }).select("id, number, created_at, moderation_status").single();

  if (error) {
    if (photoPath) await admin.storage.from("zgloszenia-zdjecia").remove([photoPath]);
    console.error("submit-report insert failed:", error.message);
    return reply({ error: "Could not save report" }, 500);
  }

  return reply({ accepted: true, report: data }, 201);
});