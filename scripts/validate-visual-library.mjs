#!/usr/bin/env node
"use strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(ROOT, "assets/visual-library/manifest.json");
const fail = (message) => { console.error("[Leon Visual Library] " + message); process.exitCode = 1; };
const safePath = (value) => typeof value === "string"
  && /^[a-z0-9][a-z0-9/_-]*\\.webp$/.test(value)
  && !value.split("/").some(part => part === "." || part === "..");

try {
  const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (data.schemaVersion !== 1 || data.id !== "leon-visual-library"
    || !Array.isArray(data.assets) || !Array.isArray(data.placements)) {
    throw new Error("Invalid manifest header or collections.");
  }
  const assets = new Map();
  for (const asset of data.assets) {
    if (!/^VIS-[0-9]{6,}$/.test(asset.assetId) || assets.has(asset.assetId)) throw new Error("Duplicate or invalid assetId: " + asset.assetId);
    if (!["draft", "approved", "published", "archived"].includes(asset.status)) throw new Error("Invalid status for " + asset.assetId);
    if (!safePath(asset.storagePath) || asset.mimeType !== "image/webp") throw new Error("Unsafe path or MIME type for " + asset.assetId);
    if (!/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error("Missing or invalid SHA-256 for " + asset.assetId);
    if (!Number.isInteger(asset.version) || asset.version < 1) throw new Error("Invalid version for " + asset.assetId);
    if (typeof asset.alt !== "string" || !asset.alt.trim()) throw new Error("Missing alt text for " + asset.assetId);
    assets.set(asset.assetId, asset);
  }
  const placements = new Set();
  for (const placement of data.placements) {
    if (!assets.has(placement.assetId)) throw new Error("Placement references unknown asset: " + placement.assetId);
    if (!/^[a-z0-9][a-z0-9/_-]*\\.html$/.test(placement.page) || placement.page.split("/").includes("..")) throw new Error("Unsafe page path.");
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(placement.slot)) throw new Error("Invalid placement slot.");
    const key = placement.page + "::" + placement.slot;
    if (placements.has(key)) throw new Error("Duplicate page slot: " + key);
    placements.add(key);
    if (assets.get(placement.assetId).status !== "published") throw new Error("Only published assets may be assigned to live page slots.");
  }
  console.log("[Leon Visual Library] OK — " + assets.size + " assets, " + placements.size + " placements.");
} catch (error) {
  fail(error.message);
}
