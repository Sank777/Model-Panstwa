import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../supabase/functions/leon-dropbox-importer/index.ts", import.meta.url), "utf8");

describe("Leon visual importer — security and storage contract", () => {
  it("restricts remote source to Dropbox HTTPS hosts", () => {
    assert.ok(src.includes('"dl.dropboxusercontent.com"'));
    assert.ok(src.includes('"content.dropboxapi.com"'));
    assert.ok(src.includes('u.protocol !== "https:"'));
    assert.ok(src.includes('redirect:"manual"'));
  });
  it("caps response size while streaming", () => {
    assert.ok(src.includes("8 * 1024 * 1024"));
    assert.ok(src.includes("total > MAX_BYTES"));
    assert.ok(src.includes("AbortSignal.timeout(20000)"));
  });
  it("checks image signatures and WebP container length", () => {
    assert.ok(src.includes('=== "RIFF"'));
    assert.ok(src.includes('=== "WEBP"'));
    assert.ok(src.includes("size === b.length"));
    assert.ok(src.includes("=== 255 && b[1] === 216"));
    assert.ok(src.includes('=== "PNG"'));
  });
  it("hashes content and stores only private drafts with rollback", () => {
    assert.ok(src.includes('crypto.subtle.digest("SHA-256"'));
    assert.ok(src.includes('from("visual-drafts")'));
    assert.ok(src.includes('status:"draft"'));
    assert.ok(src.includes("remove([objectPath])"));
  });
  it("rejects duplicate asset keys", () => {
    assert.ok(src.includes('reply({error:"Asset key already exists"},409)'));
  });
});
