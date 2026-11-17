"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const engine = fs.readFileSync(path.join(root, "assets/visual-engine.js"), "utf8");
const rom = fs.readFileSync(path.join(root, "assets/visual-rom.js"), "utf8");
const layout = fs.readFileSync(path.join(root, "assets/visual-engine-layout.css"), "utf8");
const site = fs.readFileSync(path.join(root, "assets/site.js"), "utf8");

test("asset loading is restricted to validated same-origin local image paths", () => {
  assert.match(engine, /function assetURL\(path\)/);
  assert.match(engine, /asset-path-rejected/);
  assert.match(engine, /asset-origin-rejected/);
  assert.match(engine, /url\.origin!==location\.origin/);
  assert.match(engine, /url\.pathname\.startsWith\(ROOT\.pathname\)/);
  assert.match(engine, /img\.referrerPolicy="no-referrer"/);
});

test("failed image requests are evicted from cache so a later retry can work", () => {
  assert.match(engine, /promise\.catch\(error=>\{imageCache\.delete\(url\);throw error;\}\)/);
  assert.match(engine, /function retryFailed\(\)/);
  assert.match(engine, /tile\.dataset\.visualState="idle"/);
  assert.match(engine, /while\(state\.pending\.size\)await Promise\.allSettled/);
});

test("a failed tile receives a readable fallback and an explicit failure state", () => {
  assert.match(engine, /function renderFallback\(tile,recipe,error\)/);
  assert.match(engine, /tile\.classList\.add\("visual-tile-fallback","visual-image-error"\)/);
  assert.match(engine, /tile\.dataset\.visualState="fallback"/);
  assert.match(engine, /copy\.replaceChildren\(number,title,subtitle\)/);
  assert.match(layout, /\.pillar-tile\.visual-tile-fallback > \.tile-copy/);
});

test("runtime status exposes rendered, fallback, pending and error counts", () => {
  assert.match(engine, /function getStatus\(\)/);
  assert.match(engine, /validated:tiles\.filter/);
  assert.match(engine, /rendered:tiles\.filter/);
  assert.match(engine, /fallback:tiles\.filter/);
  assert.match(engine, /pending:state\.pending\.size,errors:state\.errors\.slice\(\)/);
});

test("dynamic tiles are observed and timers/object URLs are released on page exit", () => {
  assert.match(engine, /new MutationObserver/);
  assert.match(engine, /observer\.observe/);
  assert.match(engine, /window\.setInterval\(\(\)=>\{if\(!document\.hidden\)scan\(\);\},30000\)/);
  assert.match(engine, /observer\.disconnect\(\)/);
  assert.match(engine, /window\.clearInterval\(watchdog\)/);
  assert.match(engine, /URL\.revokeObjectURL\(url\)/);
});

test("responsive hero and tile rules include mobile sizing and reduced-motion support", () => {
  assert.match(layout, /@media\(max-width:700px\)/);
  assert.match(layout, /@container leon-dashboard \(max-width:700px\)/);
  assert.match(layout, /@media\(max-width:760px\)/);
  assert.match(layout, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(site, /prefers-reduced-motion: reduce/);
  assert.match(site, /navigator\.connection && navigator\.connection\.saveData/);
});

test("ROM defines exactly ten deterministic atlas tiles with a shared sprite grid", () => {
  assert.match(rom, /version:"1\.8\.0",deterministic:true/);
  assert.match(rom, /columns:5,rows:2/);
  assert.equal((rom.match(/asset:"menu\\/leon-pillar-sprite\\.webp"/g) || []).length, 10);
});
