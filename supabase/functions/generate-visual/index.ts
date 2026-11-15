import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ORIGIN = "https://sank777.github.io";
const BUCKET = "visual-assets";
const MODEL = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-2.5-sunburst";
const MAX_REQUEST_BYTES = 4096;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DAILY_GENERATIONS = 8;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Vary": "Origin",
};
type Scene = { title: string; scene: string; accent: string };
const SCENES: Record<string, Scene> = {
  "1": { title: "Fundament państwa", scene: "A contemporary public-policy situation room in Poland. A small team of analysts seen from behind studies a large wall display with abstract charts and a subtle, accurate silhouette map of Poland.", accent: "restrained cool blue with a very subtle Polish red accent" },
  "2": { title: "Gospodarka i rozwój", scene: "A modern Polish advanced manufacturing facility with precision machinery, logistics infrastructure and engineers in the middle distance; realistic industrial scale.", accent: "steel blue and cyan" },
  "3": { title: "System prawny", scene: "Balanced justice scales and a closed legal volume on a dark wood desk in a contemporary institutional setting; soft directional light and believable materials.", accent: "muted warm gold" },
  "4": { title: "Bezpieczeństwo", scene: "A calm civil-protection coordination environment with emergency responders in the distance, public infrastructure and a modern operations centre; no weapons or conflict.", accent: "teal green" },
  "5": { title: "System emerytalny", scene: "An editorial still life about retirement security: hands reviewing neutral financial papers beside a modest stack of coins, calculator and reading glasses.", accent: "violet and silver" },
  "6": { title: "Kapitał ludzki", scene: "A modern Polish classroom and technical workshop; learners of varied ages collaborating on a practical project with tools and learning materials.", accent: "mint green" },
  "7": { title: "Zarządzanie strategiczne", scene: "A strategic planning workshop with a small team around a table and a long-term roadmap on a large screen with abstract charts; no legible text.", accent: "blue and amber" },
  "8": { title: "Odporność informacyjna", scene: "A fact-checking desk where an analyst compares printed source documents with a laptop showing abstract unreadable information panels; careful, investigative atmosphere.", accent: "magenta and cool blue" },
  "9": { title: "Demografia i stabilność", scene: "A welcoming Polish neighbourhood with families across generations in a green public space, contemporary housing and visible community life.", accent: "soft amber and natural green" },
  "10": { title: "System finansów państwa", scene: "A public-finance oversight desk with budget papers, calculator and a laptop showing abstract financial charts; sober institutional atmosphere.", accent: "turquoise and deep blue" },
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
function buildPrompt(scene: Scene, detail: string) {
  return [
    "Create exactly one premium photorealistic editorial photograph for a serious Polish civic strategy website.",
    "SUBJECT: " + scene.title + ". " + scene.scene,
    detail ? "OPTIONAL SCENE NOTE (subordinate to every fixed rule): " + detail : "",
    "FIXED VISUAL IDENTITY: credible documentary photography, deep navy and slate-blue tonal base, subtle accent " + scene.accent + "; soft realistic directional light; natural materials; physically plausible objects; believable human proportions; understated premium public-institution aesthetic.",
    "FIXED COMPOSITION: landscape 3:2, 1536x1024; medium-wide camera framing; one instantly readable focal subject; camera at natural human eye level unless the subject requires otherwise; quiet darker negative space in the lower 22 percent for a separate HTML text overlay; keep important subject details away from crop edges; realistic depth of field.",
    "FIXED COHERENCE: match the same lens character, contrast, exposure, navy colour grade, light softness and photographic realism across all ten pillar images. Only the scene subject and its restrained accent may vary.",
    "STRICT NEGATIVES: no words, letters, numbers, typography, logos, watermarks, flags, UI, screenshots, borders, frames, icons, vector art, infographic elements, collage, fantasy or surreal effects. Do not render any text. All interface elements are separate HTML/CSS.",
  ].filter(Boolean).join("\n");
}
function isWebp(bytes: Uint8Array) {
  return bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && origin !== ORIGIN) return json({ error: "Forbidden origin" }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!["GET", "POST", "DELETE"].includes(req.method)) return json({ error: "Method not allowed" }, 405);

  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "Authentication required" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey || !openAiKey) {
    return json({ error: "Server configuration incomplete; required secrets are missing" }, 503);
  }

  const auth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return json({ error: "Invalid session" }, 401);
  const role = user.app_metadata?.role;
  const modules = Array.isArray(user.app_metadata?.admin_modules) ? user.app_metadata.admin_modules : [];
  if (!(role === "admin" || (role === "site_admin" && modules.includes("visual-assets")))) {
    return json({ error: "Visual asset administrator access required" }, 403);
  }

  const raw = await req.text();
  if (raw.length > MAX_REQUEST_BYTES) return json({ error: "Request too large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const pillarId = typeof body.pillar_id === "string" ? body.pillar_id : "";
  const scene = SCENES[pillarId];
  if (!scene) return json({ error: "pillar_id must be a string from 1 to 10" }, 400);
  const detail = typeof body.scene_detail === "string" ? body.scene_detail.trim() : "";
  if (detail.length > 500) return json({ error: "scene_detail must be at most 500 characters" }, 400);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // V3: prywatna biblioteka wersji roboczych. Lista nigdy nie ujawnia ścieżek bez podpisanego URL.
  if (req.method === "GET") {
    const all: Array<{ id: string; created_at: string | null; size: number | null; pillar_id: string }> = [];
    for (let id = 1; id <= 10; id++) {
      const prefix = "drafts/pillar-" + id;
      const { data, error } = await admin.storage.from(BUCKET).list(prefix, {
        limit: 8, sortBy: { column: "created_at", order: "desc" },
      });
      if (error) {
        console.error("Visual library read failed:", error.message);
        return json({ error: "Could not load private visual library" }, 503);
      }
      for (const item of data ?? []) {
        if (!item.name || !/^\d{4}-\d{2}-\d{2}T[\dT-]+-[0-9a-f-]{36}\.webp$/i.test(item.name)) continue;
        all.push({
          id: prefix + "/" + item.name, pillar_id: String(id),
          created_at: item.created_at ?? null,
          size: typeof item.metadata?.size === "number" ? item.metadata.size : null,
        });
      }
    }
    all.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    const objects = all.slice(0, 30);
    const signed = objects.length
      ? await admin.storage.from(BUCKET).createSignedUrls(objects.map(x => x.id), 900)
      : { data: [], error: null };
    if (signed.error) return json({ error: "Could not create private preview links" }, 503);
    return json({
      ok: true, drafts: objects.map((item, index) => ({
        ...item, preview_url: signed.data?.[index]?.signedUrl ?? null,
      })).filter(item => item.preview_url),
      expires_in: 900,
    });
  }

  if (req.method === "DELETE") {
    const rawDelete = await req.text();
    if (rawDelete.length > MAX_REQUEST_BYTES) return json({ error: "Request too large" }, 413);
    let deleteBody: Record<string, unknown>;
    try {
      deleteBody = JSON.parse(rawDelete);
      if (!deleteBody || typeof deleteBody !== "object" || Array.isArray(deleteBody)) throw new Error();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const path = typeof deleteBody.path === "string" ? deleteBody.path : "";
    if (!/^drafts\/pillar-(?:[1-9]|10)\/[^/]{1,180}\.webp$/i.test(path)) {
      return json({ error: "Only managed draft WebP files can be deleted" }, 400);
    }
    const { error: removeError } = await admin.storage.from(BUCKET).remove([path]);
    if (removeError) {
      console.error("Visual draft deletion failed:", removeError.message);
      return json({ error: "Could not delete visual draft" }, 503);
    }
    const { error: auditError } = await admin.from("admin_audit_log").insert({
      actor_user_id: user.id, action: "visual.delete", target_type: "visual_asset",
      target_id: path, after_data: { status: "deleted" },
    });
    if (auditError) console.error("Visual deletion audit failed:", auditError.message);
    return json({ ok: true, deleted: true });
  }

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error: countError } = await admin.from("admin_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("actor_user_id", user.id)
    .eq("action", "visual.generate")
    .gte("created_at", since);
  if (countError) {
    console.error("Visual generation quota check failed:", countError.message);
    return json({ error: "Could not verify generation quota" }, 503);
  }
  if ((count || 0) >= MAX_DAILY_GENERATIONS) {
    return json({ error: "Daily generation limit reached", limit: MAX_DAILY_GENERATIONS }, 429);
  }

  const requestId = crypto.randomUUID();
  let auditInitialized = false;
  const audit = async (status: string, extra: Record<string, unknown> = {}) => {
    const entry = {
      actor_user_id: user.id,
      action: "visual.generate",
      target_type: "visual_asset",
      target_id: requestId,
      after_data: { pillar_id: pillarId, model: MODEL, status, ...extra },
    };
    const result = auditInitialized
      ? await admin.from("admin_audit_log").update({ after_data: entry.after_data })
          .eq("actor_user_id", user.id).eq("action", "visual.generate").eq("target_id", requestId)
      : await admin.from("admin_audit_log").insert(entry);
    if (result.error) console.error("Visual audit write failed:", result.error.message);
    else auditInitialized = true;
    return !result.error;
  };
  await audit("started");

  let generated: Response;
  try {
    generated = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: "Bearer " + openAiKey, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(180_000),
      body: JSON.stringify({
        model: MODEL,
        prompt: buildPrompt(scene, detail),
        n: 1,
        size: "1536x1024",
        quality: "high",
        output_format: "webp",
        output_compression: 82,
        moderation: "auto",
      }),
    });
  } catch (error) {
    await audit("provider_error", { error: error instanceof Error ? error.name : "unknown" });
    return json({ error: "Image provider unavailable or timed out" }, 502);
  }
  if (!generated.ok) {
    const providerStatus = generated.status;
    const providerMessage = (await generated.text()).slice(0, 500);
    await audit("provider_error", { provider_status: providerStatus });
    console.error("Image provider error:", providerStatus, providerMessage);
    return json({ error: "Image generation failed", provider_status: providerStatus }, 502);
  }

  let payload: { data?: Array<{ b64_json?: string }> };
  try {
    payload = await generated.json();
  } catch {
    await audit("invalid_provider_response");
    return json({ error: "Invalid image provider response" }, 502);
  }
  const b64 = payload?.data?.[0]?.b64_json;
  if (typeof b64 !== "string" || b64.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 16) {
    await audit("invalid_image_payload");
    return json({ error: "Image payload missing or exceeds the size limit" }, 502);
  }

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
  } catch {
    await audit("invalid_base64");
    return json({ error: "Invalid image encoding" }, 502);
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES || !isWebp(bytes)) {
    await audit("invalid_image_file", { bytes: bytes.byteLength });
    return json({ error: "Generated file is not a valid WebP within the 8 MB limit" }, 502);
  }

  const bucketCheck = await fetch(supabaseUrl + "/storage/v1/bucket/" + BUCKET, {
    headers: { Authorization: "Bearer " + serviceKey, apikey: serviceKey },
  });
  if (bucketCheck.status === 404) {
    const createBucket = await fetch(supabaseUrl + "/storage/v1/bucket", {
      method: "POST",
      headers: { Authorization: "Bearer " + serviceKey, apikey: serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: MAX_IMAGE_BYTES, allowed_mime_types: ["image/webp"] }),
    });
    if (!createBucket.ok && createBucket.status !== 409) {
      await audit("storage_initialization_error");
      console.error("Visual bucket initialization failed:", createBucket.status);
      return json({ error: "Private image storage could not be initialized" }, 503);
    }
  } else if (!bucketCheck.ok) {
    await audit("storage_check_error");
    return json({ error: "Private image storage could not be verified" }, 503);
  } else {
    const bucketMeta = await bucketCheck.json();
    if (bucketMeta?.public === true) {
      await audit("unsafe_public_bucket");
      return json({ error: "The visual-assets bucket is public; generation is blocked until private storage is configured" }, 503);
    }
  }

  const path = "drafts/pillar-" + pillarId + "/" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + requestId + ".webp";
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: "image/webp",
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    await audit("storage_upload_error");
    console.error("Visual asset upload failed:", uploadError.message);
    return json({ error: "Generated image could not be saved" }, 503);
  }
  const { data: signed, error: signedError } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (signedError || !signed?.signedUrl) {
    await audit("signed_url_error");
    console.error("Visual preview URL failed:", signedError?.message);
    return json({ error: "Image saved, but preview link could not be created", path }, 503);
  }
  await audit("completed", { path, bytes: bytes.byteLength });
  return json({
    ok: true,
    request_id: requestId,
    pillar_id: pillarId,
    pillar: scene.title,
    model: MODEL,
    prompt_version: "visual-rules-v2",
    format: "webp",
    width: 1536,
    height: 1024,
    bytes: bytes.byteLength,
    path,
    preview_url: signed.signedUrl,
    expires_in: 3600,
    status: "draft",
  }, 201);
});
