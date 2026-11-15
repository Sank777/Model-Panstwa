import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { storagePathFromPublicUrl } from "./storage-path.ts";

const allowedOrigin = "https://sank777.github.io";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}


Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && origin !== allowedOrigin) return json({ error: "Forbidden origin" }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!["GET", "PATCH", "DELETE"].includes(req.method)) return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: "Authentication required" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration is incomplete" }, 500);

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return json({ error: "Invalid session" }, 401);
  const appRole = user.app_metadata?.role;
  const moduleScopes = Array.isArray(user.app_metadata?.admin_modules) ? user.app_metadata.admin_modules : [];
  const canManageReports = appRole === "admin" || (appRole === "site_admin" && moduleScopes.includes("reports"));
  if (!canManageReports) return json({ error: "Reports module access required" }, 403);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (req.method === "GET" && new URL(req.url).searchParams.get("analytics") === "1") {
    const daysRaw = Number(new URL(req.url).searchParams.get("days") || "30");
    const days = Number.isInteger(daysRaw) ? Math.min(90, Math.max(1, daysRaw)) : 30;
    const { data, error } = await admin.rpc("get_site_analytics", { p_days: days });
    if (error) {
      console.error("admin analytics failed:", error.message);
      return json({ error: "Could not load site analytics" }, 500);
    }
    return json({ days, analytics: data || [] });
  }

  if (req.method === "GET") {
    const { data, error } = await admin.from("zgloszenia").select("id, number, time, category, description, location, status, priority, comment, photo, supports, created_at, moderation_status")
      .order("created_at", { ascending: false }).limit(1000);
    if (error) {
      console.error("admin list failed:", error.message);
      return json({ error: "Could not load reports" }, 500);
    }
    return json({ reports: data });
  }

  const raw = await req.text();
  if (raw.length > 8000) return json({ error: "Request too large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id || id.length > 128) return json({ error: "Invalid report id" }, 400);

  if (req.method === "DELETE") {
    const { data: report, error: readError } = await admin.from("zgloszenia")
      .select("id, number, category, status, moderation_status, photo")
      .eq("id", id).maybeSingle();
    if (readError) {
      console.error("admin delete preflight failed:", readError.message);
      return json({ error: "Could not prepare report deletion" }, 500);
    }
    if (!report) return json({ error: "Report not found" }, 404);

    const photoPath = storagePathFromPublicUrl(report.photo, url);
    if (report.photo && !photoPath) {
      return json({ error: "Photo reference is outside the managed bucket; deletion blocked for manual review" }, 409);
    }
    let cleanupQueueId: string | null = null;
    if (photoPath) {
      const { data: queued, error: queueError } = await admin.from("storage_cleanup_queue")
        .insert({ bucket_id: "zgloszenia-zdjecia", object_path: photoPath, created_by: user.id })
        .select("id").single();
      if (queueError || !queued) {
        console.error("storage cleanup enqueue failed:", queueError?.message);
        return json({ error: "Could not safely queue photo cleanup; report was not deleted" }, 503);
      }
      cleanupQueueId = queued.id;
    }

    const { data: deleted, error: deleteError } = await admin.from("zgloszenia")
      .delete().eq("id", id).select("id").maybeSingle();
    if (deleteError || !deleted) {
      if (cleanupQueueId) await admin.from("storage_cleanup_queue").delete().eq("id", cleanupQueueId);
      console.error("admin delete failed:", deleteError?.message);
      return json({ error: "Could not delete report" }, deleteError ? 500 : 404);
    }

    let photoCleanup = "not_required";
    if (cleanupQueueId && photoPath) {
      const { error: removeError } = await admin.storage.from("zgloszenia-zdjecia").remove([photoPath]);
      if (removeError) {
        photoCleanup = "pending";
        await admin.from("storage_cleanup_queue").update({
          status: "pending", attempts: 1, last_error: removeError.message.slice(0, 1000),
        }).eq("id", cleanupQueueId);
      } else {
        photoCleanup = "done";
        await admin.from("storage_cleanup_queue").update({
          status: "done", attempts: 1, last_error: null, processed_at: new Date().toISOString(),
        }).eq("id", cleanupQueueId);
      }
    }

    const { error: auditError } = await admin.from("admin_audit_log").insert({
      actor_user_id: user.id,
      action: "report.delete",
      target_type: "report",
      target_id: id,
      before_data: {
        number: report.number,
        category: report.category,
        status: report.status,
        moderation_status: report.moderation_status,
        had_photo: Boolean(photoPath),
      },
      after_data: { deleted: true, photo_cleanup: photoCleanup },
    });
    if (auditError) {
      console.error("admin delete audit failed:", auditError.message);
      return json({ deleted: true, id, photo_cleanup: photoCleanup, audit_recorded: false }, 202);
    }
    return json({ deleted: true, id, photo_cleanup: photoCleanup, audit_recorded: true });
  }

  const patch: Record<string, unknown> = {};
  if (Object.hasOwn(body, "moderation_status")) {
    if (!["oczekuje", "zatwierdzone", "odrzucone"].includes(String(body.moderation_status))) {
      return json({ error: "Invalid moderation status" }, 400);
    }
    patch.moderation_status = body.moderation_status;
  }
  if (Object.hasOwn(body, "status")) {
    if (!["nowe", "w_trakcie", "zamkniete"].includes(String(body.status))) {
      return json({ error: "Invalid workflow status" }, 400);
    }
    patch.status = body.status;
  }
  if (Object.hasOwn(body, "priority")) {
    if (!["niski", "normalny", "wysoki", "krytyczny"].includes(String(body.priority))) {
      return json({ error: "Invalid priority" }, 400);
    }
    patch.priority = body.priority;
  }
  if (Object.hasOwn(body, "comment")) {
    if (typeof body.comment !== "string" || body.comment.length > 1000) {
      return json({ error: "Comment must be a string up to 1000 characters" }, 400);
    }
    patch.comment = body.comment.trim();
  }
  if (Object.keys(patch).length === 0) return json({ error: "No permitted changes supplied" }, 400);

  const { data: before, error: beforeError } = await admin.from("zgloszenia")
    .select("id, number, moderation_status, status, priority, comment")
    .eq("id", id).maybeSingle();
  if (beforeError) {
    console.error("admin update preflight failed:", beforeError.message);
    return json({ error: "Could not prepare report update" }, 500);
  }
  if (!before) return json({ error: "Report not found" }, 404);

  const { data, error } = await admin.from("zgloszenia").update(patch).eq("id", id)
    .select("id, number, moderation_status, status, priority, comment").maybeSingle();
  if (error) {
    console.error("admin update failed:", error.message);
    return json({ error: "Could not update report" }, 500);
  }
  if (!data) return json({ error: "Report not found" }, 404);

  const { error: auditError } = await admin.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "report.update",
    target_type: "report",
    target_id: id,
    before_data: before,
    after_data: data,
  });
  if (auditError) {
    console.error("admin update audit failed:", auditError.message);
    return json({ report: data, audit_recorded: false }, 202);
  }
  return json({ report: data, audit_recorded: true });
});