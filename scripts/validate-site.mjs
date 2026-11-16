import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [], checks = [];
const exists = p => fs.existsSync(path.join(root,p));
function walk(dir) {
  return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>{
    const rel=path.posix.join(dir,e.name);
    return e.isDirectory() ? walk(rel) : [rel];
  });
}
const files=walk(".").filter(p=>!p.startsWith(".git/")&&!p.startsWith("node_modules/"));
function checkRef(from,ref,label) {
  if(!ref||ref.startsWith("#")||/^(?:[a-z]+:|\/\/|data:|mailto:|tel:|javascript:)/i.test(ref)||ref.includes("\${")) return;
  const clean=decodeURIComponent(ref.split(/[?#]/,1)[0]);
  if(!clean)return;
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(from),clean));
  if(!exists(target))failures.push(label+": "+from+" -> "+ref+" (brak "+target+")");
  else checks.push(label+": "+ref);
}
for(const file of files.filter(p=>p.endsWith(".html"))){
 const src=fs.readFileSync(path.join(root,file),"utf8");
 for(const m of src.matchAll(/(?:href|src)=["']([^"']+)["']/gi))checkRef(file,m[1],"HTML");
}
for(const file of files.filter(p=>p.endsWith(".css"))){
 const src=fs.readFileSync(path.join(root,file),"utf8");
 for(const m of src.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/gi))checkRef(file,m[1].trim(),"CSS");
}
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const rom=fs.readFileSync(path.join(root,"assets/visual-rom.js"),"utf8");
const engine=fs.readFileSync(path.join(root,"assets/visual-engine.js"),"utf8");
const tileCount=(index.match(/class=["'][^"']*pillar-tile\b/g)||[]).length;
if(tileCount!==10)failures.push("Oczekiwano 10 kafelków, znaleziono "+tileCount);
else checks.push("Strona główna zawiera 10 kafelków");
const dataBlock=rom.match(/const data = \[([\s\S]*?)\n  \];/);
const romItems=dataBlock?(dataBlock[1].match(/^\s*\["/gm)||[]).length:0;
if(romItems!==10)failures.push("ROM powinien zawierać 10 opisów filarów, znaleziono "+romItems);
else checks.push("ROM zawiera 10 opisów filarów");
for(const m of rom.matchAll(/asset:"([^"]+)"/g)){
 const asset=path.posix.join("assets",m[1]);
 if(!exists(asset))failures.push("ROM: brak grafiki "+asset);
 else checks.push("ROM: "+asset);
}
if(!/dataset\.visualState\s*=\s*"loaded"/.test(engine)||!/dataset\.visualState\s*=\s*"fallback"/.test(engine))failures.push("Silnik nie zapisuje stanów loaded/fallback");
else checks.push("Silnik raportuje stany grafiki");
const css=fs.readFileSync(path.join(root,"assets/visual-engine.css"),"utf8");
if(/\.pillar-tile>\.visual-engine-tile-image\s*\{[^}]*background-size:\s*cover!important/s.test(css))failures.push("CSS nadpisuje kadrowanie sprite'a regułą cover!important");
else checks.push("CSS nie blokuje kadrowania sprite'a");

const themedPages = [
 "index.html","filary.html","model.html","moduly.html","reformy.html",
 "centrum-jawnosci.html","inwestycje.html","studium-inwestycji.html",
 "odpowiedzialnosc.html","informacje-prawne.html","zasady.html","prototyp.html","admin.html"
];
for (const page of themedPages) {
 const source=fs.readFileSync(path.join(root,page),"utf8");
 if (!source.includes("assets/site-theme-v1.css?v=1.0.1")) failures.push("Brak wspólnego motywu Leon 1.0 na stronie "+page);
 else checks.push("Motyw Leon 1.0: "+page);
}
const themeCss=fs.readFileSync(path.join(root,"assets/site-theme-v1.css"),"utf8");
if (!themeCss.includes("--mp-bg:#061426") || !themeCss.includes("--mp-accent:#63b8ff")) failures.push("Wspólny motyw nie zawiera zatwierdzonej palety granatowo-niebieskiej");
else checks.push("Wspólny motyw zawiera paletę zatwierdzonego szablonu");

console.log("Kontrole: "+checks.length+" PASS, "+failures.length+" FAIL");
for(const f of failures)console.error("FAIL",f);
if(failures.length)process.exit(1);

if (!themeCss.includes('input[type="checkbox"]') || !themeCss.includes('input[type="radio"]')) failures.push("Motyw nie zachowuje natywnych kontrolek checkbox/radio");
else checks.push("Motyw zachowuje natywne kontrolki formularzy");
if (!themeCss.includes('html[data-theme="light"]')) failures.push("Motyw nie obsługuje trybu jasnego");
else checks.push("Motyw obsługuje tryb jasny i ciemny");
