"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync(require.resolve("../assets/leon-visual-runtime.js"),"utf8");
const css = fs.readFileSync(require.resolve("../assets/leon-visual-runtime.css"),"utf8");

test("runtime is opt-in and does not hijack legacy hero or tile selectors", () => {
  assert.match(source,/\[data-leon-visual-src\]/);
  assert.doesNotMatch(source,/querySelectorAll\(["']\.hero-banner|querySelectorAll\(["']\.pillar-tile/);
  assert.match(source,/window\.LeonVisualRuntime/);
});

test("runtime validates local asset paths and same-origin URLs", () => {
  assert.match(source,/asset-path-rejected/);
  assert.match(source,/asset-origin-rejected/);
  assert.match(source,/const SCRIPT_ROOT = new URL/);
  assert.match(source,/part === "\.\."|part === "\."/);
});

test("runtime avoids HTML injection and releases generated object URLs", () => {
  assert.doesNotMatch(source,/innerHTML|outerHTML|eval\s*\(|new Function/);
  assert.match(source,/URL\.revokeObjectURL/);
  assert.match(source,/MutationObserver/);
});

test("runtime supports lazy loading and respects reduced motion in its stylesheet", () => {
  assert.match(source,/IntersectionObserver/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/pointer-events:none/);
});

test("semantic page content is not replaced by image text", () => {
  assert.match(source,/image\.alt = ""/);
  assert.match(source,/aria-hidden/);
  assert.doesNotMatch(source,/replaceChildren|textContent\s*=/);
});
