import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { data, error } = await admin.from("zgloszenia").select("id, number, time, category, description, location, lat, lng, status, priority, comment, photo, supports, created_at, moderation_status, user_id")
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
    const { data, error } = await admin.from("zgloszenia").delete().eq("id", id).select("id").maybeSingle();
    if (error) {
      console.error("admin delete failed:", error.message);
      return json({ error: "Could not delete report" }, 500);
    }
    if (!data) return json({ error: "Report not found" }, 404);
    return json({ deleted: true, id });
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

  const { data, error } = await admin.from("zgloszenia").update(patch).eq("id", id)
    .select("id, number, moderation_status, status, priority, comment").maybeSingle();
  if (error) {
    console.error("admin update failed:", error.message);
    return json({ error: "Could not update report" }, 500);
  }
  if (!data) return json({ error: "Report not found" }, 404);
  return json({ report: data });
});