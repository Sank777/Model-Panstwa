import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { constantTimeEqual, retryDelaySeconds, validManagedPath } from "./worker-utils.ts";

Deno.test("worker secret comparison accepts only exact matches", () => {
  assertEquals(constantTimeEqual("a".repeat(32), "a".repeat(32)), true);
  assertEquals(constantTimeEqual("a".repeat(32), "b".repeat(32)), false);
  assertEquals(constantTimeEqual("short", "shorter"), false);
});

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
