import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const checks = [];
const exists = (relative) => fs.existsSync(path.resolve(root, relative));

function walk(dir = ".") {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

function checkLocalReference(from, reference, kind) {
  if (!reference || reference.startsWith("#") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) return;
  let decoded;
  try { decoded = decodeURIComponent(reference.split(/[?#]/, 1)[0]); }
  catch { failures.push(kind + ": niepoprawne kodowanie URL w " + from + " -> " + reference); return; }
  if (!decoded || decoded.startsWith("${")) return;
  const target = decoded.startsWith("/")
    ? path.posix.normalize(decoded.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(from), decoded));
  if (target === ".." || target.startsWith("../")) {
    failures.push(kind + ": odwołanie wychodzi poza repozytorium: " + from + " -> " + reference);
  } else if (!exists(target)) {
    failures.push(kind + ": brak zasobu " + from + " -> " + reference + " (szukano " + target + ")");
  } else checks.push(kind + ": " + reference);
}

const files = walk().filter((file) => !file.startsWith(".git/") && !file.startsWith("node_modules/"));
const htmlFiles = files.filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of source.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    checkLocalReference(file, match[1].trim(), "HTML");
  }
}
for (const file of files.filter((item) => item.endsWith(".css"))) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of source.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/gi)) {
    checkLocalReference(file, match[1].trim(), "CSS");
  }
}

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const rom = fs.readFileSync(path.join(root, "assets/visual-rom.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/visual-engine.js"), "utf8");
const layout = fs.readFileSync(path.join(root, "assets/visual-engine-layout.css"), "utf8");
const tileCount = (index.match(/class=["'][^"']*pillar-tile\b/g) || []).length;
if (tileCount !== 10) failures.push("Strona główna powinna zawierać 10 kafelków, znaleziono " + tileCount);
else checks.push("Strona główna zawiera 10 kafelków");
const visualRegistry = JSON.parse(fs.readFileSync(path.join(root, "assets/visual-registry.json"), "utf8"));
const romItems = visualRegistry.tiles.length;
if (romItems !== 10) failures.push("Rejestr grafik powinien zawierać 10 opisów filarów, znaleziono " + romItems);
else checks.push("Rejestr grafik zawiera 10 opisów filarów");
for (const assetName of new Set([visualRegistry.hero.asset, ...visualRegistry.tiles.map(tile => tile.asset)])) {
  const asset = path.posix.join("assets", assetName);
  if (!exists(asset)) failures.push("Rejestr grafik: brak pliku " + asset);
  else checks.push("Rejestr grafik: " + asset);
}
if (!/dataset\.visualState\s*=\s*"rendered"/.test(engine) || !/dataset\.visualState\s*=\s*"fallback"/.test(engine)) {
  failures.push("Silnik nie raportuje stanów rendered/fallback");
} else checks.push("Silnik raportuje stany rendered/fallback");
if (!layout.includes(".pillar-tile > .tile-copy") ||
    !layout.includes(".pillar-tile.visual-tile-fallback > .tile-copy") ||
    !layout.includes("display:none !important")) {
  failures.push("Brak reguły pojedynczego źródła tekstu: atlas albo awaryjny HTML");
} else checks.push("Pojedyncze źródło tekstu aktywne: atlas lub awaryjny HTML");

const themedPages = [
  "index.html", "filary.html", "model.html", "moduly.html", "reformy.html",
  "centrum-jawnosci.html", "inwestycje.html", "studium-inwestycji.html",
  "odpowiedzialnosc.html", "informacje-prawne.html", "zasady.html", "prototyp.html", "admin.html"
].filter(exists);
for (const page of themedPages) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  if (!source.includes("assets/site-theme-v1.css")) failures.push("Brak wspólnego arkusza motywu na " + page);
  else checks.push("Wspólny motyw: " + page);
  if (!source.includes("class=\"site-header\"")) failures.push("Brak nagłówka witryny na " + page);
  else checks.push("Nagłówek: " + page);
}
const themeCss = fs.readFileSync(path.join(root, "assets/site-theme-v1.css"), "utf8");
if (!themeCss.includes("--mp-bg:#061426") || !themeCss.includes("--mp-accent:#63b8ff")) failures.push("Nieprawidłowa wspólna paleta motywu");
else checks.push("Wspólna paleta motywu");
if (!themeCss.includes('input[type="checkbox"]') || !themeCss.includes('input[type="radio"]')) failures.push("Motyw nie uwzględnia kontrolek checkbox/radio");
else checks.push("Style kontrolek formularzy");
if (!themeCss.includes('html[data-theme="light"]')) failures.push("Brak obsługi jasnego motywu");
else checks.push("Obsługa jasnego i ciemnego motywu");

const siteJs = fs.readFileSync(path.join(root, "assets/site.js"), "utf8");
for (const [token, label] of [
  ["IntersectionObserver", "lazy motion / obserwacja widoczności"],
  ["prefers-reduced-motion: reduce", "ograniczenie ruchu"],
  ["navigator.connection.saveData", "oszczędzanie transferu"],
  ["document.visibilityState", "wstrzymanie animacji w ukrytej karcie"],
  ["new MutationObserver", "obsługa dynamicznych elementów"]
]) {
  if (!siteJs.includes(token)) failures.push("Brak mechanizmu: " + label);
  else checks.push("Mechanizm: " + label);
}

console.log("Audyt witryny: " + checks.length + " PASS, " + failures.length + " FAIL");
for (const failure of failures) console.error("FAIL", failure);
if (failures.length) process.exit(1);
