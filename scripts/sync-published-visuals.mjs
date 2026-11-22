#!/usr/bin/env node
"use strict";
import fs from "node:fs";
import path from "node:path";

const api = (process.env.SUPABASE_URL || "https://ldjrinmohlomzlyeagwd.supabase.co").replace(/\/$/, "");
const key = process.env.SUPABASE_ANON_KEY || "sb_publishable_aMRUSYoNLbIriNAxLdu9mQ_KTqqefWR";
const root = process.cwd();
const statePath = path.join(root, ".github/visual-library-sync.json");
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : { schemaVersion: 1, assets: {} };
if (!state.assets || typeof state.assets !== "object" || Array.isArray(state.assets)) throw new Error("Invalid visual sync state");

const response = await fetch(api + "/rest/v1/visual_assets?status=eq.published&select=id,asset_key,pillar_id,public_path,byte_size,sha256&order=published_at.asc", {
  headers: { apikey: key, Accept: "application/json" },
  signal: AbortSignal.timeout(30000)
});
if (!response.ok) throw new Error("Published visual registry query failed: HTTP " + response.status);
const records = await response.json();
if (!Array.isArray(records)) throw new Error("Invalid published visual registry response");

let added = 0;
for (const asset of records) {
  if (!asset || !/^[0-9a-f-]{36}$/i.test(asset.id) || !/^pillar-(?:[1-9]|10)-[0-9a-f-]{36}$/i.test(asset.asset_key)
    || !Number.isInteger(asset.pillar_id) || asset.pillar_id < 1 || asset.pillar_id > 10
    || typeof asset.public_path !== "string" || !/^published\/pillar-(?:[1-9]|10)\/pillar-(?:[1-9]|10)-[0-9a-f-]{36}\.webp$/i.test(asset.public_path)) {
    throw new Error("Rejected unsafe visual registry record");
  }
  const relative = "assets/visual-library/pillar-" + asset.pillar_id + "/" + asset.asset_key + ".webp";
  const absolute = path.join(root, relative);
  if (state.assets[asset.id] === relative && fs.existsSync(absolute) && fs.statSync(absolute).size > 0) continue;
  const url = api + "/storage/v1/object/public/visual-assets/" + asset.public_path.split("/").map(encodeURIComponent).join("/");
  const image = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!image.ok) throw new Error("Could not download published image " + asset.id + ": HTTP " + image.status);
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (bytes.length < 16 || bytes.length > 8 * 1024 * 1024
    || String.fromCharCode(...bytes.slice(0,4)) !== "RIFF"
    || String.fromCharCode(...bytes.slice(8,12)) !== "WEBP") {
    throw new Error("Invalid WebP file or size for asset " + asset.id);
  }
  if (asset.byte_size && bytes.length !== Number(asset.byte_size)) throw new Error("File size does not match registry for " + asset.id);
  if (asset.sha256) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2,"0")).join("");
    if (hash !== asset.sha256) throw new Error("SHA-256 mismatch for " + asset.id);
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, bytes);
  state.assets[asset.id] = relative;
  added++;
}
fs.mkdirSync(path.dirname(statePath), { recursive: true });
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
console.log("[Leon Visual Library] " + records.length + " published records checked; " + added + " new or repaired files.");
