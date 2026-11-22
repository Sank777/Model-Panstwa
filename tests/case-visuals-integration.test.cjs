"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/case-visuals.js"), "utf8");

test("case illustrations resolve from the shared assets directory, not the current page URL", () => {
  assert.match(source, /document\.currentScript[\s\S]*?new URL\("\.\/", scriptUrl\)/);
  assert.match(source, /new URL\(relative, ASSET_ROOT\)/);
  assert.match(source, /url\.origin !== location\.origin/);
  assert.match(source, /url\.pathname\.startsWith\(ASSET_ROOT\.pathname\)/);
});

test("all registered NIK and PSP illustration assets exist locally", () => {
  const registered = [...source.matchAll(/\["((?:cases|psp)[^"]+\.svg)",\s*"[^"]+"\]/g)].map(match => match[1]);
  assert.equal(registered.length, 14);
  for (const relative of registered) {
    assert.ok(fs.existsSync(path.join(root, "assets", relative)), "Missing illustration: " + relative);
  }
});

test("the 11 NIK topics use the current dedicated illustration set", () => {
  for (let i = 1; i <= 11; i++) {
    const number = String(i).padStart(2, "0");
    assert.ok(source.includes("cases/illustrations/nik/" + number + "-"), "Missing NIK illustration mapping " + number);
  }
});

test("case visual styles are shared by the library and nested real-case page", () => {
  const library = fs.readFileSync(path.join(root, "biblioteka-spraw.html"), "utf8");
  const nested = fs.readFileSync(path.join(root, "sprawy/real-odr-001.html"), "utf8");
  assert.match(library, /case-visuals\.css\?v=1\.0\.0/);
  assert.match(nested, /case-visuals\.css\?v=1\.1\.0/);
  assert.match(nested, /\.\.\/assets\/case-visuals\.js/);
});
