"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const cssSource = fs.readFileSync(path.join(__dirname, "../assets/visual-engine-layout.css"), "utf8");
const marker = "/* LEON 7.3.1 — FINAL RENDER AUTHORITY";
const css = cssSource.slice(cssSource.lastIndexOf(marker));
if (!cssSource.includes(marker)) throw new Error("Missing final render authority block");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const rom = fs.readFileSync(path.join(__dirname, "../assets/visual-rom.js"), "utf8");
const engine = fs.readFileSync(path.join(__dirname, "../assets/visual-engine.js"), "utf8");

test("desktop hero clips the lower part of the original image without moving the banner", () => {
  assert.match(css, /\.hero-banner\{[^}]*aspect-ratio:3\.85\/1!important[^}]*overflow:hidden!important/);
  assert.match(css, /\.hero-banner>\.visual-engine-image img\{[^}]*top:0!important[^}]*height:130%!important[^}]*object-fit:cover!important[^}]*object-position:50% 0%!important/);
  assert.match(css, /transform:none!important/);
});

test("mobile hero applies a separate, slightly smaller vertical crop", () => {
  assert.match(css, /@container leon-dashboard \(max-width:700px\)\{\.hero-banner>\.visual-engine-image img\{height:125%!important;object-position:50% 0%!important\}/);
  assert.match(css, /@media\(max-width:700px\)\{\.hero-banner\{[^}]*aspect-ratio:3\.55\/1!important[^}]*\}\.hero-banner>\.visual-engine-image img\{height:125%!important/);
  assert.match(css, /\.hero-banner\{aspect-ratio:3\.55\/1!important;height:auto!important;min-height:0!important/);
});

test("hero keeps the original repository asset, title overlay, and versioned stylesheet", () => {
  assert.match(rom, /asset:"menu\/leon-hero\.webp"/);
  assert.match(html, /<section class="hero-banner"[^>]*>[\s\S]*?<div class="hero-copy">/);
  assert.match(html, /visual-engine-layout\.css\?v=7\.3\.4/);
});


test("pillar tiles render without frames, shadows, or overlay accents", () => {
  assert.match(css, /\.pillar-tile\{[^}]*border:0!important[^}]*outline:0!important[^}]*box-shadow:none!important/);
  assert.match(css, /\.pillar-tile>\.visual-engine-tile-image\{[^}]*inset:-9%!important[^}]*width:118%!important[^}]*height:118%!important/);
  assert.match(css, /\.pillar-tile:before,\.pillar-tile:after\{display:none!important;content:none!important/);
});

test("successful atlas render removes duplicate generated tile labels", () => {
  assert.match(engine, /const generatedCopy=directChild\(tile,"tile-copy"\);[\s\S]*?if\(generatedCopy\)generatedCopy\.remove\(\);[\s\S]*?if\(generatedIcon\)generatedIcon\.remove\(\);/);
  assert.match(engine, /const VERSION="7\\.3\\.4";/);
});
