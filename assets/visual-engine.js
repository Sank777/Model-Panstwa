/* Leon Visual Engine 6.8.0 — ROM-first, deterministic, fail-closed renderer.
   The ROM is the single source of truth. No geometry or CSS artwork fallback is permitted. */
(() => {
  "use strict";
  const VERSION="6.8.0";
  const script=document.currentScript;
  const ROOT=new URL("./menu/",script&&script.src?script.src:location.href);
  const ROM=window.LeonVisualROM;
  const state={started:false,hero:"idle",loaded:0,failed:0,errors:[],startedAt:Date.now()};
  const tiles=Array.from(document.querySelectorAll(".pillar-tile"));
  const hero=document.querySelector(".hero-banner");
  const safeAsset=name=>{
    if(typeof name!=="string"||!/^[a-z0-9_-]+\.(webp|png|jpe?g)$/i.test(name))throw new Error("asset-name-rejected");
    const url=new URL(name,ROOT);
    if(url.origin!==location.origin||!url.pathname.startsWith(ROOT.pathname))throw new Error("asset-path-rejected");
    return url.href;
  };
  const loadImage=url=>new Promise((resolve,reject)=>{
    const img=new Image();
    img.decoding="async";
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error("asset-load-failed:"+url.split("/").pop()));
    img.src=url;
  });
  const cache=new Map();
  function preload(name){
    const url=safeAsset(name);
    if(!cache.has(url))cache.set(url,loadImage(url));
    return cache.get(url);
  }
  async function renderHero(){
    if(!hero||!ROM||!ROM.hero)return;
    try{
      const url=safeAsset(ROM.hero.asset);
      await preload(ROM.hero.asset);
      let layer=hero.querySelector(":scope > .visual-engine-image");
      if(!layer){
        layer=document.createElement("div");
        layer.className="visual-engine-image";
        layer.setAttribute("aria-hidden","true");
        const img=document.createElement("img");
        img.alt="";
        img.decoding="async";
        img.loading="eager";
        img.referrerPolicy="no-referrer";
        img.src=url;
        layer.appendChild(img);
        hero.prepend(layer);
      }else{
        const img=layer.querySelector("img");
        if(img&&img.src!==url)img.src=url;
      }
      hero.classList.add("visual-hero-ready");
      state.hero="loaded";
    }catch(error){
      state.hero="failed";
      state.errors.push("hero:"+error.message);
      hero.classList.add("visual-image-error");
    }
  }
  function tileKey(tile){
    return Array.from(tile.classList).find(name=>/^pillar-(?:[1-9]|10)$/.test(name));
  }
  async function renderTile(tile){
    const key=tileKey(tile);
    const recipe=key&&ROM&&ROM.tiles&&ROM.tiles[key];
    if(!recipe){tile.dataset.visualState="failed";state.failed++;state.errors.push("tile-rom-missing:"+key);return;}
    if(tile.dataset.visualState==="loaded"||tile.dataset.visualState==="loading")return;
    tile.dataset.visualState="loading";
    tile.style.setProperty("--tile-accent",recipe.accent);
    try{
      const url=safeAsset(recipe.asset);
      await preload(recipe.asset);
      let layer=tile.querySelector(":scope > .visual-engine-tile-image");
      if(!layer){layer=document.createElement("div");layer.className="visual-engine-tile-image";layer.setAttribute("aria-hidden","true");tile.prepend(layer);}
      layer.style.backgroundImage='url("'+url+'")';
      layer.style.backgroundRepeat="no-repeat";
      layer.style.backgroundSize="500% 200%";
      layer.style.backgroundPosition=(recipe.spriteIndex%5*25)+"% "+(Math.floor(recipe.spriteIndex/5)*100)+"%";
      tile.style.setProperty("background-image","none","important");
      let icon=tile.querySelector(":scope > .tile-icon");
      let copy=tile.querySelector(":scope > .tile-copy");
      if(!icon){icon=document.createElement("span");icon.className="tile-icon";icon.setAttribute("aria-hidden","true");tile.appendChild(icon);}
      if(!copy){copy=document.createElement("span");copy.className="tile-copy";tile.appendChild(copy);}
      icon.textContent=recipe.icon;
      copy.replaceChildren();
      const small=document.createElement("small"),title=document.createElement("strong"),sub=document.createElement("em");
      small.textContent="Filar "+key.slice(7);
      title.textContent=recipe.title;
      sub.textContent=recipe.subtitle;
      copy.append(small,title,sub);
      tile.dataset.visualState="loaded";
      tile.classList.add("visual-image-ready");
      tile.classList.remove("visual-image-error");
      state.loaded++;
    }catch(error){
      tile.dataset.visualState="failed";
      tile.classList.add("visual-image-error");
      state.failed++;
      state.errors.push(key+":"+error.message);
    }
  }
  function status(){
    return Object.freeze({
      version:VERSION,rom:ROM?ROM.version:"missing",started:state.started,hero:state.hero,
      tiles:{total:tiles.length,loaded:state.loaded,failed:state.failed},
      errors:state.errors.slice(),renderer:"rom-first-sprite-5x2",assetRoot:ROOT.href
    });
  }
  function retryFailed(){
    state.failed=0;
    state.errors=[];
    const jobs=tiles.filter(tile=>tile.dataset.visualState==="failed").map(tile=>{tile.dataset.visualState="idle";return renderTile(tile);});
    if(state.hero==="failed"){state.hero="idle";jobs.push(renderHero());}
    return Promise.all(jobs).then(status);
  }
  function start(){
    if(state.started)return;
    state.started=true;
    window.ModelPanstwaVisualEngine=Object.freeze({version:VERSION,getStatus:status,retryFailed});
    if(!ROM||!ROM.hero||!ROM.tiles){
      state.errors.push("rom-missing-or-invalid");
      console.error("[Leon Visual Engine] ROM unavailable",status());
      return;
    }
    Promise.all([renderHero(),...tiles.map(renderTile)]).then(()=>console.info("[Leon Visual Engine]",status()));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();