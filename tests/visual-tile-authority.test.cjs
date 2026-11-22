"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "assets/visual-engine-layout.css"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/visual-engine.js"), "utf8");
const rom = fs.readFileSync(path.join(root, "assets/visual-rom.js"), "utf8");
const pages = ["index.html", "filary.html", "admin.html"].map(file => fs.readFileSync(path.join(root, file), "utf8"));

test("every pillar uses a separate standalone SVG, not a shared sprite atlas", () => {
  for (let i=1;i<=10;i++) {
    const n=String(i).padStart(2,"0");
    assert.match(rom, new RegExp("leon-filar-"+n+"-[a-z-]+\\.svg"));
    assert.ok(css.includes(".pillar-tile.pillar-"+i+"{background-image:url("));
  }
  assert.doesNotMatch(rom, /leon-pillar-sprite|spriteIndex|spriteGrid/);
  assert.match(rom, /mode:"single"/);
});

test("local CSS artwork remains visible even if JavaScript cannot start", () => {
  assert.ok(css.includes('background-image:url("menu/leon-hero.webp")'));
  assert.ok(css.includes('background-image:url("menu/leon-filar-10-finanse.svg")'));
  assert.match(css, /\.pillar-tile>\.tile-copy\{display:flex!important/);
});

test("HTML labels remain available over standalone artwork", () => {
  assert.match(engine, /Keep accessible HTML labels above the independent SVG artwork/);
  assert.doesNotMatch(engine, /generatedCopy\)generatedCopy\.remove/);
});

test("visual pages share the same engine version; admin loads layout only", () => {
  for (const html of pages) assert.match(html, /visual-engine-layout\.css\?v=7\.4\.0/);
  for (const page of pages.slice(0, 2)) assert.match(page, /visual-engine\.js\?v=7\.4\.0/);
  assert.doesNotMatch(pages[2], /visual-engine\.js/);
  assert.match(engine, /const VERSION="7\.4\.0";/);
});
