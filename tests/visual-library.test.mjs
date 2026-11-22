import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const manifest = path.join(root, "assets/visual-library/manifest.json");
test("central visual manifest is valid and contains no unapproved placeholder assets", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-visual-library.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const data = JSON.parse(fs.readFileSync(manifest, "utf8"));
  assert.deepEqual(data.assets, []);
  assert.deepEqual(data.placements, []);
});
