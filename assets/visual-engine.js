/* Leon Visual Engine 6.10.3 — retry-safe local assets and deterministic sprite crops. */
(() => {
  "use strict";
  const VERSION="6.10.3";
  if(window.__LEON_VISUAL_ENGINE_INSTANCE__)return;
  window.__LEON_VISUAL_ENGINE_INSTANCE__=VERSION;
  const script=document.currentScript;
  const ROOT=new URL("./",script&&script.src?script.src:location.href);
  const ROM=window.LeonVisualROM;
  const state={started:false,hero:"idle",loaded:0,failed:0,errors:[],startedAt:Date.now()};
  const tiles=Array.from(document.querySelectorAll(".pillar-tile"));
  const hero=document.querySelector(".hero-banner");
  const safeAsset=name=>{
    if(typeof name!=="string"||!/^[a-z0-9_/-]+\.(webp|png|jpe?g)$/i.test(name)||name.split("/").some(p=>p===".."||p==="."))throw new Error("asset-name-rejected");
    const url=new URL(name,ROOT);
    if(url.origin!==location.origin||!url.pathname.startsWith(ROOT.pathname))throw new Error("asset-path-rejected");
    return url.href;
  };
  const cache=new Map();
  function preload(name){
    const url=safeAsset(name);
    if(!cache.has(url)){
      const task=new Promise((resolve,reject)=>{
        const img=new Image();img.decoding="async";
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error("asset-load-failed:"+url.split("/").pop()));
        img.src=url;
      }).catch(error=>{cache.delete(url);throw error;});
      cache.set(url,task);
    }
    return cache.get(url);
  }
  function renderHeroFallback(){
    if(!hero)return;
    hero.classList.add("visual-hero-fallback");
    hero.classList.remove("visual-hero-ready","visual-image-error");
    state.hero="fallback";
  }
  async function renderHero(){
    if(!hero||!ROM||!ROM.hero)return;
    try{
      const url=safeAsset(ROM.hero.asset);
      await preload(ROM.hero.asset);
      let layer=hero.querySelector(":scope > .visual-engine-image");
      if(!layer){
        layer=document.createElement("div");layer.className="visual-engine-image";
        layer.setAttribute("aria-hidden","true");
        const img=document.createElement("img");img.alt="";img.decoding="async";
        img.loading="eager";img.referrerPolicy="no-referrer";img.src=url;
        layer.appendChild(img);hero.prepend(layer);
      }else{
        const img=layer.querySelector("img");if(img&&img.src!==url)img.src=url;
      }
      hero.classList.add("visual-hero-ready");hero.classList.remove("visual-image-error");
      state.hero="loaded";
    }catch(error){state.hero="failed";state.errors.push("hero:"+error.message);hero.classList.add("visual-image-error");renderHeroFallback();}
  }
  function tileKey(tile){return Array.from(tile.classList).find(name=>/^pillar-(?:[1-9]|10)$/.test(name));}
  async function renderTile(tile){
    const key=tileKey(tile),recipe=key&&ROM&&ROM.tiles&&ROM.tiles[key];
    if(!recipe){tile.dataset.visualState="failed";state.failed++;state.errors.push("tile-rom-missing:"+key);return;}
    if(tile.dataset.visualState==="loaded"||tile.dataset.visualState==="loading")return;
    tile.dataset.visualState="loading";
    tile.style.setProperty("--tile-accent",recipe.accent);
    try{
      const url=safeAsset(recipe.asset);await preload(recipe.asset);
      let layer=tile.querySelector(":scope > .visual-engine-tile-image");
      if(!layer){layer=document.createElement("div");layer.className="visual-engine-tile-image";layer.setAttribute("aria-hidden","true");tile.prepend(layer);}
      layer.style.backgroundImage='url("'+url+'")';
      layer.style.backgroundRepeat="no-repeat";
      layer.style.backgroundSize="500% 200%";
      const col=recipe.spriteIndex%5,row=Math.floor(recipe.spriteIndex/5);
      layer.style.backgroundPosition=(col*25)+"% "+(row*100)+"%";
      tile.style.setProperty("background-image","none","important");
      tile.querySelectorAll(":scope > .tile-icon, :scope > .tile-copy").forEach(node=>node.remove());
      tile.dataset.visualState="loaded";tile.classList.add("visual-image-ready");tile.classList.remove("visual-image-error");
      state.loaded++;
    }catch(error){
      tile.dataset.visualState="fallback";tile.classList.add("visual-image-error","visual-tile-fallback");
      const icon=document.createElement("span");icon.className="tile-icon";icon.setAttribute("aria-hidden","true");icon.textContent=recipe.icon||"◆";
      const copy=document.createElement("span");copy.className="tile-copy";
      const number=document.createElement("small");number.textContent="Filar "+key.replace("pillar-","");
      const title=document.createElement("strong");title.textContent=recipe.title||"Obszar rozwoju państwa";
      const subtitle=document.createElement("em");subtitle.textContent=recipe.subtitle||"";
      copy.append(number,title,subtitle);tile.replaceChildren(icon,copy);
      state.failed++;state.errors.push(key+":"+error.message);
    }
  }
  function status(){return Object.freeze({version:VERSION,rom:ROM?ROM.version:"missing",started:state.started,hero:state.hero,tiles:{total:tiles.length,loaded:state.loaded,failed:state.failed},errors:state.errors.slice(),renderer:"rom-first-sprite-5x2-menu-assets-retry-safe",assetRoot:ROOT.href});}
  function retryFailed(){
    state.failed=0;state.errors=[];
    const jobs=tiles.filter(tile=>tile.dataset.visualState==="failed").map(tile=>{tile.dataset.visualState="idle";return renderTile(tile);});
    if(state.hero==="failed"||state.hero==="fallback"){state.hero="idle";jobs.push(renderHero());}
    return Promise.all(jobs).then(status);
  }
  function start(){
    if(state.started)return;state.started=true;
    window.ModelPanstwaVisualEngine=Object.freeze({version:VERSION,getStatus:status,retryFailed});
    if(!ROM||!ROM.hero||!ROM.tiles){state.errors.push("rom-missing-or-invalid");console.error("[Leon Visual Engine] ROM unavailable",status());return;}
    Promise.all([renderHero(),...tiles.map(renderTile)]).then(()=>console.info("[Leon Visual Engine]",status()));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
