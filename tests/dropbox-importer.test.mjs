import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../supabase/functions/leon-dropbox-importer/index.ts", import.meta.url), "utf8");

describe("Leon visual importer — security and storage contract", () => {
  it("restricts remote source to Dropbox HTTPS hosts and validates redirects", () => {
    assert.ok(src.includes('"dl.dropboxusercontent.com"'));
    assert.ok(src.includes('"content.dropboxapi.com"'));
    assert.ok(src.includes('u.protocol !== "https:"'));
    assert.match(src, /redirect:\s*"manual"/);
    assert.ok(src.includes("safeDropboxUrl(new URL(location, current).toString())"));
  });
  it("caps response size while streaming and applies a timeout", () => {
    assert.ok(src.includes("8 * 1024 * 1024"));
    assert.ok(src.includes("total > MAX_BYTES"));
    assert.ok(src.includes("AbortSignal.timeout(20000)"));
  });
  it("checks image signatures and exact WebP container length", () => {
    assert.ok(src.includes('=== "RIFF"'));
    assert.ok(src.includes('=== "WEBP"'));
    assert.match(src, /getUint32\(4,\s*true\)\s*\+\s*8\s*===\s*b\.length/);
    assert.ok(src.includes("b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff"));
    assert.ok(src.includes('=== "PNG"'));
  });
  it("hashes content and stores only private drafts with rollback", () => {
    assert.ok(src.includes('crypto.subtle.digest("SHA-256"'));
    assert.ok(src.includes('from("visual-drafts")'));
    assert.match(src, /status:\s*"draft"/);
    assert.ok(src.includes("remove([objectPath])"));
  });
  it("rejects duplicate asset keys", () => {
    assert.match(src, /reply\(\{\s*error:\s*"Asset key already exists"\s*\},\s*409\)/);
  });
});
