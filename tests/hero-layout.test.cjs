"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "../assets/visual-engine-layout.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const rom = fs.readFileSync(path.join(__dirname, "../assets/visual-rom.js"), "utf8");

test("desktop hero clips the lower part of the original image without moving the banner", () => {
  assert.match(css, /\.hero-banner\{[^}]*aspect-ratio:3\.85\/1!important[^}]*overflow:hidden!important/);
  assert.match(css, /\.hero-banner>\.visual-engine-image img\{[^}]*top:0!important[^}]*height:130%!important[^}]*object-fit:cover!important[^}]*object-position:50% 0%!important/);
  assert.match(css, /transform:none!important/);
});

test("mobile hero applies a separate, slightly smaller vertical crop", () => {
  assert.match(css, /@container leon-dashboard \(max-width:700px\)\{\.hero-banner>\.visual-engine-image img\{height:125%!important;object-position:50% 0%!important\}/);
  assert.match(css, /@media\(max-width:700px\)\{\.hero-banner>\.visual-engine-image img\{height:125%!important/);
  assert.match(css, /\.hero-banner\{aspect-ratio:3\.55\/1!important;height:auto!important;min-height:0!important/);
});

test("hero keeps the original repository asset, title overlay, and versioned stylesheet", () => {
  assert.match(rom, /asset:"menu\/leon-hero\.webp"/);
  assert.match(html, /<section class="hero-banner"[^>]*>[\s\S]*?<div class="hero-copy">/);
  assert.match(html, /visual-engine-layout\.css\?v=7\.6\.0/);
});
