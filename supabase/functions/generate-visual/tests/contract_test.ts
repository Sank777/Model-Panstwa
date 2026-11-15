// Lightweight source-level contract checks for the Visual Engine.
import { assert, assertEquals } from "jsr:@std/assert@1";
const source = await Deno.readTextFile(new URL("../supabase/functions/generate-visual/index.ts", import.meta.url));
Deno.test("visual engine uses the supported pinned image model", () => {
  assert(source.includes('|| "gpt-image-2.5-sunburst"'));
  assert(source.includes("https://api.openai.com/v1/images/generations"));
});
Deno.test("visual engine enforces server-side admin scope", () => {
  assert(source.includes('role === "admin"'));
  assert(source.includes('modules.includes("visual-assets")'));
  assert(source.includes("auth.getUser(token)"));
  assert(!source.includes("user_metadata?.role"));
});
Deno.test("visual engine does not publish drafts publicly", () => {
  assert(source.includes('public: false'));
  assert(source.includes("createSignedUrl(path, 3600)"));
  assert(source.includes('status: "draft"'));
});
Deno.test("visual engine limits cost and validates WebP", () => {
  assert(source.includes("MAX_DAILY_GENERATIONS = 8"));
  assert(source.includes("MAX_IMAGE_BYTES = 8 * 1024 * 1024"));
  assert(source.includes("isWebp(bytes)"));
  assert(source.includes("AbortSignal.timeout(180_000)"));
});
Deno.test("visual engine never overwrites generated assets", () => {
  assert(source.includes("upsert: false"));
  assert(source.includes('action: "visual.generate"'));
});
