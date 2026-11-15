import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseBearerHeader } from "./auth.ts";

Deno.test("no Authorization header remains anonymous", () => {
  assertEquals(parseBearerHeader(null), { token: null, invalid: false });
  assertEquals(parseBearerHeader("   "), { token: null, invalid: false });
});

Deno.test("valid Bearer token is extracted", () => {
  assertEquals(parseBearerHeader("Bearer abc.def_123"), { token: "abc.def_123", invalid: false });
  assertEquals(parseBearerHeader("bearer token-value"), { token: "token-value", invalid: false });
});

Deno.test("malformed Authorization is rejected instead of becoming anonymous", () => {
  for (const value of ["Basic abc", "Bearer", "Bearer token extra", "Bearer    ", "token"]) {
    assertEquals(parseBearerHeader(value).invalid, true, value);
  }
});
