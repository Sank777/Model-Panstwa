import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const checks = [];
const exists = (p) => fs.existsSync(path.join(root, p));
function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return walk(rel);
    return [rel];
  });
}
const files = walk(".").filter(p => !p.startsWith(".git/") && !p.startsWith("node_modules/"));
const htmlFiles = files.filter(p => p.endsWith(".html"));
const cssFiles = files.filter(p => p.endsWith(".css"));
function checkRef(from, ref, label) {
  if (!ref || ref.startsWith("#") || /^(?:[a-z]+:|\/\/|data:|mailto:|tel:|javascript:)/i.test(ref) || ref.includes("${")) return;
  const clean = decodeURIComponent(ref.split(/[?#]/, 1)[0]);
  if (!clean) return;
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(from), clean));
  if (!exists(target)) failures.push(`${label}: ${from} -> ${ref} (brak ${target})`);
  else checks.push(`${label}: ${ref}`);
}
for (const file of htmlFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) checkRef(file, match[1], "HTML");
}
for (const file of cssFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/gi)) checkRef(file, match[1].trim(), "CSS");
}
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const rom = fs.readFileSync(path.join(root, "assets/visual-rom.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/visual-engine.js"), "utf8");
const tileCount = (index.match(/class=["'][^"']*pillar-tile\b/g) || []).length;
if (tileCount !== 10) failures.push(`Oczekiwano 10 kafelków, znaleziono ${tileCount}`);
else checks.push("Strona główna zawiera 10 kafelków");
const romKeys = [...rom.matchAll(/["']pillar-(\d+)["']\s*:/g)].map(m => Number(m[1]));
if (romKeys.length !== 10 || new Set(romKeys).size !== 10) failures.push("ROM nie zawiera dokładnie 10 unikalnych receptur filarów");
else checks.push("ROM zawiera 10 receptur filarów");
for (const m of rom.matchAll(/asset:"([^"]+)"/g)) {
  const asset = path.posix.join("assets", m[1]);
  if (!exists(asset)) failures.push(`ROM: brak grafiki ${asset}`);
  else checks.push(`ROM: ${asset}`);
}
if (!/dataset\.visualState\s*=\s*"loaded"/.test(engine) || !/dataset\.visualState\s*=\s*"fallback"/.test(engine)) failures.push("Silnik nie zapisuje stanów loaded/fallback");
else checks.push("Silnik raportuje stany grafiki");
if (/\.pillar-tile>\.visual-engine-tile-image\s*\{[^}]*background-size:\s*cover!important/s.test(fs.readFileSync(path.join(root,"assets/visual-engine.css"),"utf8"))) failures.push("CSS nadpisuje kadrowanie sprite'a regułą cover!important");
else checks.push("CSS nie blokuje kadrowania sprite'a");
console.log(`Kontrole: ${checks.length} PASS, ${failures.length} FAIL`);
for (const failure of failures) console.error("FAIL", failure);
if (failures.length) process.exit(1);
