"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const segmenter = require("../assets/visual-segmenter.js");

test("pillar atlas produces exactly ten exact 400x265 crops", () => {
  const cells = segmenter.planGrid(2112, 594, {columns:5, rows:2, padding:24, gapX:16, gapY:16});
  assert.equal(cells.length, 10);
  for (const cell of cells) assert.deepEqual([cell.width,cell.height],[400,265]);
  assert.deepEqual(cells.map(({x,y})=>[x,y]),[
    [24,24],[440,24],[856,24],[1272,24],[1688,24],
    [24,305],[440,305],[856,305],[1272,305],[1688,305]
  ]);
});

test("atlas crops never enter padding or gutters", () => {
  const cells = segmenter.planGrid(2112,594,{columns:5,rows:2,padding:24,gapX:16,gapY:16});
  for (const cell of cells) {
    assert.ok(cell.x >= 24 && cell.y >= 24);
    assert.ok(cell.x + cell.width <= 2088);
    assert.ok(cell.y + cell.height <= 570);
  }
  for (let i=0;i<cells.length;i++) for(let j=i+1;j<cells.length;j++) {
    const a=cells[i],b=cells[j];
    const overlap=a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
    assert.equal(overlap,false);
  }
});

test("legacy equal-grid mode remains compatible", () => {
  const cells=segmenter.planGrid(1000,400,{columns:5,rows:2});
  assert.equal(cells.length,10);
  assert.deepEqual([cells[0].x,cells[0].y,cells[0].width,cells[0].height],[0,0,200,200]);
  assert.deepEqual([cells[9].x,cells[9].y,cells[9].width,cells[9].height],[800,200,200,200]);
});

test("spacing and dimensions reject unsafe configurations", () => {
  assert.throws(()=>segmenter.planGrid(100,100,{columns:5,rows:2,padding:-1}),/invalid-grid-spacing/);
  assert.throws(()=>segmenter.planGrid(100,100,{columns:5,rows:2,gapX:-2}),/invalid-grid-spacing/);
  assert.throws(()=>segmenter.planGrid(20,20,{columns:5,rows:2,padding:10}),/grid-spacing-exceeds-source/);
  assert.throws(()=>segmenter.planGrid(100,100,{columns:11,rows:10}),/invalid-grid-size/);
});

test("irregular dimensions distribute remainder pixels without gaps", () => {
  const cells=segmenter.planGrid(101,51,{columns:5,rows:2});
  assert.equal(cells.reduce((sum,c)=>sum+c.width,0),101*2);
  assert.equal(cells[4].x+cells[4].width,101);
  assert.equal(cells[9].y+cells[9].height,51);
});
