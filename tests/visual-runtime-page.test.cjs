"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync(require.resolve("../leon-visual-test.html"),"utf8");

test("visual test page loads the local segmenter before the modular runtime", () => {
  assert.match(html,/assets\/visual-segmenter\.js\?v=2\.1\.0/);
  assert.match(html,/assets\/leon-visual-runtime\.js\?v=1\.0\.1/);
  assert.ok(html.indexOf("visual-segmenter.js") < html.indexOf("leon-visual-runtime.js"));
});

test("visual test page contains one hero and exactly ten atlas segments", () => {
  assert.match(html,/data-leon-visual-src="menu\/leon-hero\.webp" data-leon-visual-mode="single"/);
  const tiles = [...html.matchAll(/data-leon-visual-src="menu\/leon-pillar-sprite\.webp"/g)];
  assert.equal(tiles.length,10);
  for(let index=0;index<10;index++) assert.match(html,new RegExp('data-leon-visual-index="'+index+'"'));
});

test("visual test page exposes a live runtime status check", () => {
  assert.match(html,/window\.LeonVisualRuntime/);
  assert.match(html,/getStatus\(\)/);
  assert.match(html,/aria-live="polite"/);
});
