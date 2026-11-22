import {describe,it} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src=fs.readFileSync(new URL("../supabase/functions/leon-dropbox-importer/index.ts",import.meta.url),"utf8");
describe("Leon Dropbox importer guardrails",()=>{
 it("allows only HTTPS Dropbox content hosts and disables redirects",()=>{
  assert.match(src,/dl\\.dropboxusercontent\\.com/); assert.match(src,/content\\.dropboxapi\\.com/);
  assert.match(src,/u\\.protocol !== "https:"/); assert.match(src,/redirect:"manual"/);
 });
 it("bounds streaming reads to 8 MiB",()=>{assert.match(src,/MAX_BYTES = 8 \* 1024 \* 1024/);assert.match(src,/total > MAX_BYTES/);});
 it("recognizes JPEG PNG and structurally sized WebP",()=>{
  assert.match(src,/b\[0\] === 255 && b\[1\] === 216/);assert.match(src,/"PNG"/);assert.match(src,/"WEBP"/);
 });
 it("hashes content and stages only private drafts",()=>{
  assert.match(src,/SHA-256/);assert.match(src,/from\("visual-drafts"\)/);assert.match(src,/status:"draft"/);
  assert.match(src,/remove\(\[objectPath\]\)/);
 });
 it("rejects duplicate catalog keys",()=>assert.match(src,/status:409/));
});
