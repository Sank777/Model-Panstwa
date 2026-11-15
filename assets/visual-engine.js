/* Leon Visual Engine 6.1 — WebP hero + 5x2 sprite compositor. */
(() => {
  "use strict";
  const VERSION = "6.1.0";
  const script = document.currentScript;
  const ROOT = new URL("./menu/", script && script.src ? script.src : location.href);
  const hero = document.querySelector(".hero-banner");
  const tiles = Array.from(document.querySelectorAll(".pillar-tile"));
  const ROM = window.LeonVisualROM;
  const state = {version:VERSION,started:false,hero:hero?"idle":"missing",
    tiles:{total:tiles.length,loaded:0,failed:0,pending:0},assets:[],errors:[]};
  const safeAsset = value => typeof value === "string" && /^[a-zA-Z0-9_-]+\.webp$/i.test(value);
  const urlFor = value => {
    if (!safeAsset(value)) throw new TypeError("asset-name-rejected");
    const url = new URL(value, ROOT);
    if (url.origin !== location.origin) throw new TypeError("cross-origin-asset-blocked");
    return url.href;
  };
  const record = (id,asset,reason) => {
    state.errors.push({id,asset,reason});
    if (state.errors.length > 30) state.errors.shift();
  };
  const setAsset = (id,asset,status) => {
    state.assets = state.assets.filter(x=>x.id!==id);
    state.assets.push({id,asset,status});
  };
  function renderHero() {
    if (!hero || !ROM || !ROM.hero) return;
    const stage=document.createElement("div");
    stage.className="visual-engine-image";
    stage.setAttribute("aria-hidden","true");
    const img=document.createElement("img");
    img.alt=""; img.draggable=false; img.decoding="async"; img.loading="eager";
    img.referrerPolicy="no-referrer";
    img.style.cssText="position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;object-position:"+ROM.hero.focal+";";
    if ("fetchPriority" in img) img.fetchPriority="high";
    img.addEventListener("load",()=>{hero.dataset.visualState="loaded";hero.classList.add("visual-image-ready");state.hero="loaded";setAsset("hero",ROM.hero.asset,"loaded");},{once:true});
    img.addEventListener("error",()=>{hero.dataset.visualState="failed";hero.classList.add("visual-image-error");state.hero="error";record("hero",ROM.hero.asset,"image-load-failed");setAsset("hero",ROM.hero.asset,"failed");},{once:true});
    stage.appendChild(img); hero.prepend(stage);
    img.src=urlFor(ROM.hero.asset);
  }
  function recipeFor(tile) {
    for (const key of Object.keys(ROM.tiles)) if (tile.classList.contains(key)) return ROM.tiles[key];
    return null;
  }
  function renderTile(tile) {
    if (tile.dataset.visualState==="loading" || tile.dataset.visualState==="loaded") return;
    const recipe=recipeFor(tile);
    if (!recipe || !ROM.sprite || !safeAsset(recipe.sprite)) {
      tile.dataset.visualState="failed"; tile.classList.add("visual-image-error");
      state.tiles.failed++; record("tile",recipe&&recipe.sprite,"recipe-or-sprite-missing"); return;
    }
    tile.dataset.visualState="loading"; state.tiles.pending++;
    tile.style.setProperty("--tile-accent",recipe.accent);
    tile.style.setProperty("--tile-shade-opacity",recipe.shade==="strong"?"0.58":"0.38");
    const stage=document.createElement("div");
    stage.className="visual-engine-tile-image";
    stage.setAttribute("aria-hidden","true");
    const img=document.createElement("img");
    img.className="visual-sprite-crop";
    img.alt=""; img.draggable=false; img.decoding="async"; img.loading="lazy";
    img.referrerPolicy="no-referrer";
    img.style.cssText="position:absolute;display:block;max-width:none;object-fit:fill;margin:0;padding:0;border:0;";
    img.style.setProperty("inset","auto","important");
    img.style.setProperty("width","500%","important");
    img.style.setProperty("height","200%","important");
    img.style.setProperty("left",(-recipe.column*100)+"%","important");
    img.style.setProperty("top",(-recipe.row*100)+"%","important");
    img.style.setProperty("object-fit","fill","important");
    img.addEventListener("load",()=>{
      tile.dataset.visualState="loaded";tile.classList.add("visual-image-ready");
      state.tiles.loaded++;state.tiles.pending=Math.max(0,state.tiles.pending-1);
      setAsset(recipe.id,recipe.sprite+"#"+recipe.column+","+recipe.row,"loaded");
    },{once:true});
    img.addEventListener("error",()=>{
      tile.dataset.visualState="failed";tile.classList.add("visual-image-error");
      state.tiles.failed++;state.tiles.pending=Math.max(0,state.tiles.pending-1);
      record(recipe.id,recipe.sprite,"sprite-load-failed");
      setAsset(recipe.id,recipe.sprite,"failed");
    },{once:true});
    stage.appendChild(img);tile.prepend(stage);img.src=urlFor(recipe.sprite);
  }
  function start() {
    if(state.started)return;state.started=true;
    if(!ROM||!ROM.tiles||!ROM.hero){record("engine","visual-rom.js","visual-rom-missing");return;}
    renderHero();
    tiles.slice(0,2).forEach(renderTile);
    if("IntersectionObserver" in window){
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){observer.unobserve(entry.target);renderTile(entry.target);}
      }),{rootMargin:"600px 0px",threshold:0.01});
      tiles.slice(2).forEach(tile=>observer.observe(tile));
    }else tiles.slice(2).forEach(renderTile);
    window.ModelPanstwaVisualEngine=Object.freeze({
      version:VERSION,
      getStatus(){return {version:VERSION,started:state.started,hero:state.hero,
        tiles:{...state.tiles},assets:state.assets.map(x=>({...x})),
        errors:state.errors.map(x=>({...x})),tileCount:tiles.length,
        recipeCount:Object.keys(ROM.tiles).length,renderer:"webp-5x2-sprite",assetRoot:ROOT.href,rom:ROM.version};},
      retryFailed(){
        if(hero&&state.hero==="error"){state.hero="idle";renderHero();}
        tiles.filter(x=>x.dataset.visualState==="failed").forEach(x=>{
          x.dataset.visualState="idle";state.tiles.failed=Math.max(0,state.tiles.failed-1);renderTile(x);
        });
      }
    });
    window.dispatchEvent(new CustomEvent("model-panstwa:visual-ready",{detail:{version:VERSION,tiles:tiles.length,recipes:Object.keys(ROM.tiles).length}}));
    console.info("[Leon Visual Engine]",window.ModelPanstwaVisualEngine.getStatus());
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();