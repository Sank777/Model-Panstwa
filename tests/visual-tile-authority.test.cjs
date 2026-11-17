"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "assets/visual-engine-layout.css"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/visual-engine.js"), "utf8");
const pages = ["index.html", "filary.html", "admin.html"].map(file =>
  fs.readFileSync(path.join(root, file), "utf8")
);

test("atlas is the only typography source after a successful tile render", () => {
  assert.match(css, /\.pillar-tile > \.tile-copy,\s*\.pillar-tile > \.tile-icon \{ display:none !important; \}/);
  assert.match(engine, /if\(generatedCopy\)generatedCopy\.remove\(\);[\s\S]*?if\(generatedIcon\)generatedIcon\.remove\(\);/);
});

test("HTML labels are visible only in the explicit image fallback state", () => {
  assert.match(css, /\.pillar-tile\.visual-tile-fallback > \.tile-copy\s*\{\s*display:flex !important;/);
  assert.doesNotMatch(css, /\.pillar-tile > \.tile-copy strong\{[^}]*-webkit-line-clamp:2/);
  assert.doesNotMatch(css, /\.pillar-tile > \.tile-copy em\{[^}]*-webkit-line-clamp:2/);
});

test("all pages use the same visual engine and stylesheet versions", () => {
  for (const html of pages) {
    assert.match(html, /visual-engine-layout\.css\?v=7\.3\.4/);
    assert.match(html, /visual-engine\.js\?v=7\.3\.4/);
  }
  assert.match(engine, /const VERSION="7\.3\.4";/);
});
