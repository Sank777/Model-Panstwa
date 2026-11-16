"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "../assets/visual-engine-layout.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const rom = fs.readFileSync(path.join(__dirname, "../assets/visual-rom.js"), "utf8");

test("hero preserves the complete original 3:1 composition", () => {
  assert.match(css, /\.hero-banner\{[^}]*aspect-ratio:3\/1!important/);
  assert.match(css, /\.hero-banner>\.visual-engine-image img\{[^}]*object-fit:contain!important/);
  assert.match(css, /object-position:50% 50%!important/);
});

test("mobile layout does not override the full-frame hero ratio", () => {
  const mobileRules = css.match(/@container leon-dashboard \(max-width:700px\)\{([^}]*(?:\}[^}]*)?)\}/)?.[1] || "";
  assert.match(css, /@container leon-dashboard \(max-width:700px\)/);
  assert.match(css, /aspect-ratio:3\/1!important/);
  assert.doesNotMatch(mobileRules, /object-fit:cover/);
});

test("hero uses the original repository asset and keeps title overlay", () => {
  assert.match(rom, /asset:"menu\/leon-hero\.webp"/);
  assert.match(html, /<section class="hero-banner"[^>]*>[\s\S]*?<div class="hero-copy">/);
  assert.match(html, /visual-engine-layout\.css\?v=7\.3\.0/);
});
