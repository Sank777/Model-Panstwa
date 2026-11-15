(() => {
"use strict";

/* Visual Engine v2
   Renderowanie prawdziwych plików graficznych (nie CSS-owych atrap).
   Nie wymaga frameworka ani zewnętrznych bibliotek. */
const doc=document;
const hero=doc.querySelector(".hero-banner");
const tiles=Array.from(doc.querySelectorAll(".pillar-tile"));
const base=new URL(".",doc.baseURI);
const asset=(path)=>new URL(path,base).href;
const heroPath="assets/menu/polska-hero.webp";
const tileAssets={
 "pillar-1":"assets/menu/architektura-systemu.jpg",
 "pillar-2":"assets/menu/nasza-koncepcja.svg",
 "pillar-3":"assets/menu/informacje-prawne.svg",
 "pillar-4":"assets/menu/zgloszenia-obywatelskie.svg",
 "pillar-5":"assets/menu/jawnosc-wydatkow.jpg",
 "pillar-6":"assets/menu/dziesiec-filarow.svg",
 "pillar-7":"assets/menu/reformy.svg",
 "pillar-8":"assets/menu/jawnosc-decyzji.svg",
 "pillar-9":"assets/menu/strona-glowna.svg",
 "pillar-10":"assets/menu/zasady-projektowe.svg"
};
const state={version:"2.0.0",hero:"waiting",tiles:{loaded:0,failed:0,pending:0},errors:[]};
const report=(kind,url)=>{state.errors.push({kind,url});if(state.errors.length>20)state.errors.shift();};
const setImage=(el,url,cls,priority)=>{
 const img=new Image();
 img.decoding="async";
 if(priority){img.fetchPriority="high";img.loading="eager";}
 else {img.loading="lazy";img.fetchPriority="low";}
 img.onload=async()=>{
   try{if(img.decode)await img.decode()}catch(_){}
   el.style.backgroundImage="none";
   const visible=doc.createElement("img");
   visible.className=cls;
   visible.alt="";
   visible.setAttribute("aria-hidden","true");
   visible.decoding="async";
   visible.loading=priority?"eager":"lazy";
   if(priority)visible.fetchPriority="high";
   visible.src=url;
   el.prepend(visible);
   el.classList.add("visual-image-ready");
   if(priority)state.hero="loaded";
   else {state.tiles.loaded++;state.tiles.pending=Math.max(0,state.tiles.pending-1);}
 };
 img.onerror=()=>{
   el.classList.add("visual-image-error");
   report("load",url);
   if(priority)state.hero="error";
   else {state.tiles.failed++;state.tiles.pending=Math.max(0,state.tiles.pending-1);}
 };
 img.src=url;
};
if(hero){
 hero.classList.add("visual-engine-active");
 state.hero="loading";
 setImage(hero,asset(heroPath),"visual-engine-image",true);
}else state.hero="missing-container";

const loadTile=(tile)=>{
 if(tile.dataset.visualLoaded==="1")return;
 const key=Object.keys(tileAssets).find(k=>tile.classList.contains(k));
 if(!key)return;
 tile.dataset.visualLoaded="1";
 state.tiles.pending++;
 setImage(tile,asset(tileAssets[key]),"visual-engine-tile-image",false);
};
if("IntersectionObserver"in window){
 const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);loadTile(entry.target);}
 },{rootMargin:"320px 0px"});
 tiles.forEach(tile=>observer.observe(tile));
}else tiles.forEach(loadTile);

window.ModelPanstwaVisualEngine=Object.freeze({
 version:state.version,
 getStatus:()=>({version:state.version,hero:state.hero,tiles:{...state.tiles},errors:state.errors.slice(),tileCount:tiles.length})
});
})();