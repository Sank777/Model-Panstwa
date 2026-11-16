"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "../assets/visual-engine-layout.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const rom = fs.readFileSync(path.join(__dirname, "../assets/visual-rom.js"), "utf8");

test("desktop hero crops only the bottom and keeps the original image top visible", () => {
  assert.match(css, /\.hero-banner\{[^}]*aspect-ratio:3\.25\/1!important/);
  assert.match(css, /\.hero-banner>\.visual-engine-image img\{[^}]*object-fit:cover!important/);
  assert.match(css, /object-position:50% 0%!important/);
});

test("mobile hero uses a compact crop while retaining the same top focal point", () => {
  assert.match(css, /@container leon-dashboard \(max-width:700px\)/);
  assert.match(css, /\.hero-banner\{aspect-ratio:3\.15\/1!important;height:auto!important;min-height:clamp\(105px,27vw,140px\)!important/);
  assert.match(css, /object-fit:cover!important;object-position:50% 0%!important/);
});

test("hero keeps the original repository asset, title overlay, and current stylesheet version", () => {
  assert.match(rom, /asset:"menu\/leon-hero\.webp"/);
  assert.match(html, /<section class="hero-banner"[^>]*>[\s\S]*?<div class="hero-copy">/);
  assert.match(html, /visual-engine-layout\.css\?v=7\.4\.0/);
});
