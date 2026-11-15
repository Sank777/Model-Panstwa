import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { storagePathFromPublicUrl } from "./storage-path.ts";

const base = "https://project.supabase.co";

Deno.test("accepts only managed report object URLs", () => {
  assertEquals(
    storagePathFromPublicUrl(`${base}/storage/v1/object/public/zgloszenia-zdjecia/reports/abc-123.jpg`, base),
    "reports/abc-123.jpg",
  );
});

Deno.test("rejects foreign origin and other buckets", () => {
  assertEquals(storagePathFromPublicUrl("https://evil.example/storage/v1/object/public/zgloszenia-zdjecia/reports/a.jpg", base), null);
  assertEquals(storagePathFromPublicUrl(`${base}/storage/v1/object/public/other/reports/a.jpg`, base), null);
});

Deno.test("rejects traversal, nested paths, and malformed escapes", () => {
  assertEquals(storagePathFromPublicUrl(`${base}/storage/v1/object/public/zgloszenia-zdjecia/reports/%2e%2e`, base), null);
  assertEquals(storagePathFromPublicUrl(`${base}/storage/v1/object/public/zgloszenia-zdjecia/reports/a/b.jpg`, base), null);
  assertEquals(storagePathFromPublicUrl(`${base}/storage/v1/object/public/zgloszenia-zdjecia/reports/%ZZ.jpg`, base), null);
});
