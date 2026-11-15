import { assert, assertEquals, assertMatch, assertNotMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";

const source = await Deno.readTextFile(new URL("./index.ts", import.meta.url));
const adminHtml = await Deno.readTextFile(new URL("../../../admin.html", import.meta.url));

Deno.test("all ten pillars have a fixed scene definition", () => {
  for (let id = 1; id <= 10; id++) {
    assertMatch(source, new RegExp('"'+id+'"\\s*:\\s*\\{\\s*title:'));
  }
});

Deno.test("fixed visual prompt preserves shared composition and excludes generated typography", () => {
  assert(source.includes("landscape 3:2, 1536x1024"));
  assert(source.includes("lower 22 percent"));
  assert(source.includes("no words, letters, numbers, typography"));
  assert(source.includes("Only the scene subject and its restrained accent may vary."));
});

Deno.test("generation is authenticated and administrator roles come from app_metadata", () => {
  assert(source.includes("auth.auth.getUser(token)"));
  assert(source.includes("user.app_metadata?.role"));
  assert(source.includes("user.user_metadata") === false);
  assert(source.includes("Visual asset administrator access required"));
});

Deno.test("image output is constrained to WebP and a private bucket", () => {
  assert(source.includes('output_format: "webp"'));
  assert(source.includes('const BUCKET = "visual-assets"'));
  assert(source.includes("public: false"));
  assert(source.includes("!isWebp(bytes)"));
  assert(source.includes("upsert: false"));
  assert(source.includes("createSignedUrl(path, 3600)"));
});

Deno.test("library can only delete managed draft paths", () => {
  assertMatch(source, /drafts\\\\\/pillar-\(\?:\[1-9\]\|10\)\\\\\/\[\^\/\]\{1,180\}\\\\\.webp/);
  assert(source.includes('action: "visual.delete"'));
  assert(source.includes('req.method === "DELETE"'));
});

Deno.test("admin UI does not contain a server-side OpenAI key and exposes library controls", () => {
  assertNotMatch(adminHtml, /sk-[A-Za-z0-9_-]{20,}/);
  assert(adminHtml.includes('id="visualLibraryRefresh"'));
  assert(adminHtml.includes('id="visualLibrary"'));
  assert(adminHtml.includes('id="visualDesk"'));
});
