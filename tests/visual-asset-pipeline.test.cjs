"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/visual-registry.json"), "utf8"));
const rom = fs.readFileSync(path.join(root, "assets/visual-rom.js"), "utf8");

test("approved visual registry contains the 10 original pillar artworks and hero", () => {
  assert.equal(manifest.tiles.length, 10);
  assert.equal(manifest.hero.asset, "menu/leon-hero.webp");
  assert.ok(manifest.tiles.every(tile => tile.asset === "menu/leon-pillar-sprite.webp" && tile.mode === "grid"));
  assert.deepEqual(manifest.tiles.map(tile => tile.spriteIndex), [0,1,2,3,4,5,6,7,8,9]);
});

test("all registered source artwork files exist and are non-empty", () => {
  for (const asset of [manifest.hero.asset, ...new Set(manifest.tiles.map(tile => tile.asset))]) {
    const file = path.join(root, "assets", asset);
    assert.ok(fs.existsSync(file), "Missing approved artwork: " + asset);
    assert.ok(fs.statSync(file).size > 0, "Empty approved artwork: " + asset);
  }
});

test("generated ROM points to approved artwork, it does not contain replacement illustrations", () => {
  assert.match(rom, /menu\/leon-pillar-sprite\.webp/);
  assert.match(rom, /menu\/leon-hero\.webp/);
  assert.match(rom, /spriteIndex/);
  assert.doesNotMatch(rom, /leon-filar-\d{2}-[a-z-]+\.svg/);
});

test("manifest and generated ROM are reproducible and in sync", () => {
  const result = spawnSync(process.execPath, ["scripts/build-visual-assets.mjs", "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
