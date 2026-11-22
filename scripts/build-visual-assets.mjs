#!/usr/bin/env node
"use strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "assets/visual-registry.json");
const OUTPUT = path.join(ROOT, "assets/visual-rom.js");
const fail = (message) => { console.error("[Leon Visual Assets] " + message); process.exitCode = 1; };
const safeAsset = (value) => typeof value === "string"
  && /^[a-z0-9_/-]+\.(?:webp|png|jpe?g|avif|svg)$/i.test(value)
  && !value.split("/").some(part => part === "." || part === "..");

function validate(data) {
  if (data.schemaVersion !== 1 || !Array.isArray(data.tiles) || data.tiles.length !== 10) throw new Error("Manifest musi zawierać schemaVersion 1 i dokładnie 10 kafelków filarów.");
  if (!data.hero || !safeAsset(data.hero.asset)) throw new Error("Nieprawidłowa grafika hero.");
  const ids = new Set();
  const checkAsset = (asset) => {
    if (!safeAsset(asset)) throw new Error("Niedozwolona ścieżka grafiki: " + asset);
    const full = path.join(ROOT, "assets", asset);
    if (!full.startsWith(path.join(ROOT, "assets") + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile() || fs.statSync(full).size === 0) throw new Error("Brak pliku grafiki lub pusty plik: assets/" + asset);
  };
  checkAsset(data.hero.asset);
  for (const tile of data.tiles) {
    if (!/^pillar-(?:[1-9]|10)$/.test(tile.id) || ids.has(tile.id)) throw new Error("Nieprawidłowe lub powtórzone ID kafelka: " + tile.id);
    ids.add(tile.id);
    if (!["single", "grid"].includes(tile.mode)) throw new Error("Nieobsługiwany tryb grafiki dla " + tile.id);
    checkAsset(tile.asset);
    if (tile.mode === "grid" && (!Number.isInteger(tile.spriteIndex) || tile.spriteIndex < 0)) throw new Error("Brak poprawnego spriteIndex dla " + tile.id);
    if (tile.mode === "single" && tile.spriteIndex !== undefined) throw new Error("Tryb single nie może mieć spriteIndex: " + tile.id);
    for (const field of ["title", "subtitle", "icon", "accent"]) if (typeof tile[field] !== "string" || !tile[field].trim()) throw new Error("Brak pola " + field + " dla " + tile.id);
  }
  if (ids.size !== 10) throw new Error("Rejestr filarów jest niekompletny.");
  if (data.tiles.some(tile => tile.mode === "grid") && (!data.spriteGrid || !Number.isInteger(data.spriteGrid.columns) || !Number.isInteger(data.spriteGrid.rows) || data.tiles.some(tile => tile.mode === "grid" && tile.spriteIndex >= data.spriteGrid.columns * data.spriteGrid.rows))) throw new Error("Nieprawidłowa siatka atlasu lub indeks poza zakresem.");
}

function build(data) {
  const tiles = Object.fromEntries(data.tiles.map(tile => [tile.id, {
    id: tile.id, asset: tile.asset, mode: tile.mode,
    ...(tile.mode === "grid" ? { spriteIndex: tile.spriteIndex } : {}),
    title: tile.title, subtitle: tile.subtitle, icon: tile.icon, accent: tile.accent,
    ...(tile.fit ? { fit: tile.fit } : {}),
    ...(tile.focal ? { focal: tile.focal } : {})
  }]));
  const lines = [
    "/* GENERATED FILE — edit assets/visual-registry.json, then run node scripts/build-visual-assets.mjs */",
    "(() => {",
    '  "use strict";',
    "  const tiles = " + JSON.stringify(tiles, null, 2).replace(/^/gm, "  ") + ";",
    "  window.LeonVisualROM = Object.freeze({",
    '    id: "model-panstwa-home-reference",',
    '    version: "' + data.version + '",',
    "    deterministic: true,",
    ...(data.spriteGrid ? ["    spriteGrid: Object.freeze(" + JSON.stringify(data.spriteGrid) + "),"] : []),
    "    hero: Object.freeze(" + JSON.stringify(data.hero) + "),",
    "    tiles: Object.freeze(Object.fromEntries(Object.entries(tiles).map(([key, value]) => [key, Object.freeze(value)])))",
    "  });",
    "})();",
    ""
  ];
  return lines.join("\n");
}

try {
  const data = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  validate(data);
  const output = build(data);
  if (process.argv.includes("--check")) {
    const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
    if (current !== output) throw new Error("visual-rom.js jest nieaktualny. Uruchom: node scripts/build-visual-assets.mjs");
    console.log("[Leon Visual Assets] OK — manifest, pliki i wygenerowany ROM są zgodne.");
  } else {
    fs.writeFileSync(OUTPUT, output);
    console.log("[Leon Visual Assets] Wygenerowano assets/visual-rom.js z zatwierdzonego manifestu.");
  }
} catch (error) {
  fail(error.message);
}
