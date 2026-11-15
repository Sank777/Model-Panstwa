import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { constantTimeEqual, retryDelaySeconds, validManagedPath } from "./worker-utils.ts";

const MAX_BATCH = 20;
const MAX_ATTEMPTS = 8;
const corsHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("STORAGE_CLEANUP_WORKER_SECRET");
  const suppliedSecret = req.headers.get("x-worker-secret") ?? "";
  if (!expectedSecret || expectedSecret.length < 32 || !constantTimeEqual(suppliedSecret, expectedSecret)) {
    return reply({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return reply({ error: "Server configuration is incomplete" }, 500);

  let batchSize = 10;
  try {
    const raw = await req.text();
    if (raw.length > 1000) return reply({ error: "Request too large" }, 413);
    if (raw.trim()) {
      const body = JSON.parse(raw);
      if (!body || typeof body !== "object" || Array.isArray(body)) return reply({ error: "Invalid JSON" }, 400);
      if (body.limit !== undefined) {
        if (!Number.isInteger(body.limit) || body.limit < 1 || body.limit > MAX_BATCH) {
          return reply({ error: "limit must be an integer from 1 to 20" }, 400);
        }
        batchSize = body.limit;
      }
    }
  } catch {
    return reply({ error: "Invalid JSON" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: jobs, error: claimError } = await admin.rpc("claim_storage_cleanup_jobs", { p_limit: batchSize });
  if (claimError) {
    console.error("storage cleanup claim failed:", claimError.message);
    return reply({ error: "Could not claim cleanup jobs" }, 500);
  }

  const results = { claimed: (jobs ?? []).length, done: 0, retrying: 0, dead: 0, rejected: 0 };

  for (const job of jobs ?? []) {
    if (!validManagedPath(job.bucket_id, job.object_path)) {
      results.rejected++;
      await admin.from("storage_cleanup_queue").update({
        status: "dead", locked_at: null, last_error: "Rejected unmanaged Storage path",
      }).eq("id", job.id).eq("status", "processing");
      continue;
    }

    const { error: removeError } = await admin.storage.from(job.bucket_id).remove([job.object_path]);
    if (!removeError) {
      const { error: updateError } = await admin.from("storage_cleanup_queue").update({
        status: "done", locked_at: null, last_error: null, processed_at: new Date().toISOString(),
      }).eq("id", job.id).eq("status", "processing");
      if (updateError) {
        console.error("storage cleanup completion update failed:", updateError.message);
        results.retrying++;
      } else {
        results.done++;
      }
      continue;
    }

    const exhausted = job.attempts >= MAX_ATTEMPTS;
    const delay = retryDelaySeconds(job.attempts);
    const { error: updateError } = await admin.from("storage_cleanup_queue").update({
      status: exhausted ? "dead" : "pending",
      locked_at: null,
      next_attempt_at: new Date(Date.now() + delay * 1000).toISOString(),
      last_error: removeError.message.slice(0, 1000),
    }).eq("id", job.id).eq("status", "processing");

    if (updateError) {
      console.error("storage cleanup retry update failed:", updateError.message);
      results.retrying++;
    } else if (exhausted) {
      results.dead++;
    } else {
      results.retrying++;
    }
  }

  return reply(results);
});
