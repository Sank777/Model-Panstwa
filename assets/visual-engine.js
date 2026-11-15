(() => {
"use strict";
const root=document.querySelector(".dashboard-home");
if(!root)return;
const hero=root.querySelector(".hero-banner");
const heroUrl=new URL("assets/menu/polska-hero.webp",document.baseURI).href;
if(hero&&!hero.querySelector(".hero-art")){
 const img=document.createElement("img");
 img.className="hero-art";img.alt="";img.setAttribute("aria-hidden","true");
 img.decoding="async";img.fetchPriority="high";img.loading="eager";
 img.addEventListener("error",()=>{hero.classList.add("hero-image-error");console.error("[Visual Engine] Nie udało się pobrać panoramy:",heroUrl)},{once:true});
 img.src=heroUrl;hero.prepend(img);
}
const images={
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
const tiles=[...root.querySelectorAll(".pillar-tile")],loaded=new WeakSet();
const loadTile=tile=>{
 if(loaded.has(tile))return;
 const key=[...tile.classList].find(name=>Object.hasOwn(images,name));
 if(!key)return;loaded.add(tile);
 const url=new URL(images[key],document.baseURI).href,probe=new Image();
 probe.decoding="async";
 probe.onload=()=>{tile.style.setProperty("background-image",'url("'+url+'")',"important");tile.classList.add("is-image-ready")};
 probe.onerror=()=>{tile.classList.add("is-image-error");console.error("[Visual Engine] Brak zasobu kafelka:",url)};
 probe.src=url;
};
if("IntersectionObserver"in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){loadTile(entry.target);observer.unobserve(entry.target)}}),{rootMargin:"240px 0px"});
 tiles.forEach(tile=>observer.observe(tile));
}else tiles.forEach(loadTile);
window.ModelPanstwaVisualEngine=Object.freeze({
 version:"1.0.0",tiles:tiles.length,strategy:"hero-priority / tiles-intersection-lazy",
 getStatus:()=>({heroLoaded:!!(hero&&hero.querySelector(".hero-art")&&hero.querySelector(".hero-art").complete&&hero.querySelector(".hero-art").naturalWidth>0),tilesLoaded:tiles.filter(t=>t.classList.contains("is-image-ready")).length,tilesFailed:tiles.filter(t=>t.classList.contains("is-image-error")).length})
});
})();