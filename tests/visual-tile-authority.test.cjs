"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "assets/visual-engine-layout.css"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/visual-engine.js"), "utf8");
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith(".html"));
const pages = htmlFiles.map(file => ({ file, html: fs.readFileSync(path.join(root, file), "utf8") }));

test("atlas is the only typography source after a successful tile render", () => {
  assert.match(css, /\.pillar-tile > \.tile-copy,\s*\.pillar-tile > \.tile-icon \{ display:none !important; \}/);
  assert.match(engine, /if\(generatedCopy\)generatedCopy\.remove\(\);[\s\S]*?if\(generatedIcon\)generatedIcon\.remove\(\);/);
});

test("HTML labels are visible only in the explicit image fallback state", () => {
  assert.match(css, /\.pillar-tile\.visual-tile-fallback > \.tile-copy\s*\{\s*display:flex !important;/);
  assert.doesNotMatch(css, /\.pillar-tile > \.tile-copy strong\{[^}]*-webkit-line-clamp:2/);
  assert.doesNotMatch(css, /\.pillar-tile > \.tile-copy em\{[^}]*-webkit-line-clamp:2/);
});

test("fallback typography has one CSS authority and survives legacy stylesheet rules", () => {
  const legacyCss = fs.readFileSync(path.join(root, "assets/visual-engine.css"), "utf8");
  assert.doesNotMatch(legacyCss, /\.pillar-tile\s*>\s*\.tile-copy\s*,\s*\.pillar-tile\s*>\s*\.tile-icon\s*\{\s*display\s*:\s*none/i);
  assert.match(css, /\.pillar-tile\.visual-tile-fallback\s*>\s*\.tile-copy\s*\{\s*display:flex\s*!important/i);
});

test("legacy per-pillar CSS backgrounds cannot override the ROM renderer", () => {
  const siteCss = fs.readFileSync(path.join(root, "assets/site.css"), "utf8");
  assert.doesNotMatch(siteCss, /\.pillar-(?:[1-9]|10)\s*\{[^}]*background-image\s*:/s);
  assert.match(siteCss, /Tile artwork is supplied exclusively by LeonVisualROM and visual-engine\.js/);
});

test("tile artwork is not assigned through inline page styles", () => {
  for (const { file, html } of pages) {
    assert.doesNotMatch(html, /\.pillar-(?:[1-9]|10)\s*\{[^}]*background-image\s*:/s, file + ": tile images must not be assigned by page CSS");
  }
});

test("visual styles load in cascade order on every page", () => {
  for (const { file, html } of pages) {
    const legacy = html.indexOf("visual-engine.css");
    const authority = html.indexOf("visual-engine-layout.css");
    if (legacy >= 0 && authority >= 0) assert.ok(legacy < authority, file + ": layout authority must load after base visual CSS");
  }
});

test("all pages use one visual engine release; admin loads layout only", () => {
  for (const { file, html } of pages) {
    if (html.includes("visual-engine-layout.css")) {
      assert.match(html, /visual-engine-layout\.css\?v=7\.3\.4/, file);
    }
    if (html.includes("visual-engine.js")) {
      assert.match(html, /visual-engine\.js\?v=7\.3\.4/, file);
    }
  }
  const admin = pages.find(page => page.file === "admin.html");
  assert.ok(admin, "admin.html must exist");
  assert.doesNotMatch(admin.html, /visual-engine\.js/);
  assert.match(engine, /const VERSION="7\.3\.4";/);
});
