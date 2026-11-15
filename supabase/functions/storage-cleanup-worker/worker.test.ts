import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

function validManagedPath(bucket: string, path: string): boolean {
  if (bucket !== "zgloszenia-zdjecia" || path.length > 200) return false;
  return /^reports\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(path);
}

function retryDelaySeconds(attempts: number): number {
  return Math.min(24 * 60 * 60, 60 * (2 ** Math.max(0, attempts - 1)));
}

Deno.test("only UUID image paths in the managed reports folder are accepted", () => {
  const id = "123e4567-e89b-42d3-a456-426614174000";
  assertEquals(validManagedPath("zgloszenia-zdjecia", `reports/${id}.jpg`), true);
  assertEquals(validManagedPath("other-bucket", `reports/${id}.jpg`), false);
  assertEquals(validManagedPath("zgloszenia-zdjecia", `reports/../${id}.jpg`), false);
  assertEquals(validManagedPath("zgloszenia-zdjecia", `reports/${id}/nested.jpg`), false);
  assertEquals(validManagedPath("zgloszenia-zdjecia", "reports/not-a-uuid.jpg"), false);
});

Deno.test("retry delay is exponential and capped at one day", () => {
  assertEquals(retryDelaySeconds(1), 60);
  assertEquals(retryDelaySeconds(2), 120);
  assertEquals(retryDelaySeconds(8), 7680);
  assertEquals(retryDelaySeconds(20), 86400);
});
