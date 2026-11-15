"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { planSegments } = require("../assets/visual-segmenter.js");

test("5x2 atlas produces ten independent, contiguous rectangles", () => {
  const parts = planSegments(1000, 400);
  assert.equal(parts.length, 10);
  assert.deepEqual(parts[0], { index: 0, row: 0, column: 0, x: 0, y: 0, width: 200, height: 200 });
  assert.deepEqual(parts[4], { index: 4, row: 0, column: 4, x: 800, y: 0, width: 200, height: 200 });
  assert.deepEqual(parts[5], { index: 5, row: 1, column: 0, x: 0, y: 200, width: 200, height: 200 });
  assert.deepEqual(parts[9], { index: 9, row: 1, column: 4, x: 800, y: 200, width: 200, height: 200 });
});

test("rectangles cover the source exactly with no overlap or gaps", () => {
  const parts = planSegments(1200, 600, { columns: 4, rows: 3 });
  const area = parts.reduce((sum, part) => sum + part.width * part.height, 0);
  assert.equal(area, 1200 * 600);
  for (const part of parts) {
    assert.ok(part.x >= 0 && part.y >= 0);
    assert.ok(part.x + part.width <= 1200);
    assert.ok(part.y + part.height <= 600);
  }
});

test("rejects uneven grids rather than silently cutting neighboring pixels", () => {
  assert.throws(() => planSegments(1001, 400), /source-does-not-divide-evenly/);
  assert.throws(() => planSegments(1000, 401), /source-does-not-divide-evenly/);
});

test("rejects invalid dimensions and excessive image sizes", () => {
  assert.throws(() => planSegments(0, 400), /invalid-source-dimensions/);
  assert.throws(() => planSegments(1000.5, 400), /invalid-source-dimensions/);
  assert.throws(() => planSegments(16385, 2), /source-image-limit-exceeded/);
  assert.throws(() => planSegments(10000, 5000), /source-image-limit-exceeded/);
});

test("rejects invalid or excessive grid definitions", () => {
  assert.throws(() => planSegments(1000, 400, { columns: 0, rows: 2 }), /invalid-grid-size/);
  assert.throws(() => planSegments(1000, 400, { columns: 11, rows: 10 }), /invalid-grid-size/);
  assert.throws(() => planSegments(1000, 400, { columns: 2.5, rows: 2 }), /invalid-grid-size/);
});

test("returned plan and rectangles are immutable", () => {
  const parts = planSegments(1000, 400);
  assert.ok(Object.isFrozen(parts));
  assert.ok(Object.isFrozen(parts[0]));
});
