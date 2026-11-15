/* Leon Visual Engine 6.4 — one image and one text layer per tile. */
(() => {
  "use strict";
  if(window.ModelPanstwaVisualEngine&&window.ModelPanstwaVisualEngine.version)return;
  const VERSION="6.5.0",script=document.currentScript;
  const ROOT=new URL("./menu/",script&&script.src?script.src:location.href);
  const ROM=window.LeonVisualROM,hero=document.querySelector(".hero-banner");
  const tiles=Array.from(document.querySelectorAll(".pillar-tile"));
  const state={started:false,hero:"idle",loaded:0,failed:0,errors:[]};
  const safeAsset=v=>typeof v==="string"&&/^[a-zA-Z0-9_-]+\.(?:webp|svg)$/i.test(v);
  const assetURL=v=>{if(!safeAsset(v))throw new TypeError("asset-name-rejected");const u=new URL(v,ROOT);if(u.origin!==location.origin)throw new TypeError("cross-origin-asset-blocked");return u.href;};
  function addImage(host,asset,cls,priority,onload,onerror){
    const stage=document.createElement("div");stage.className=cls;stage.setAttribute("aria-hidden","true");
    const img=document.createElement("img");img.alt="";img.draggable=false;img.decoding="async";img.loading=priority?"eager":"lazy";img.referrerPolicy="no-referrer";
    if(priority&&"fetchPriority"in img)img.fetchPriority="high";
    img.addEventListener("load",()=>onload&&onload(),{once:true});img.addEventListener("error",()=>onerror&&onerror(),{once:true});
    stage.appendChild(img);host.prepend(stage);img.src=assetURL(asset);
  }
  function renderHero(){if(!hero||!ROM.hero)return;try{addImage(hero,ROM.hero.asset,"visual-engine-image",true,()=>{state.hero="loaded";hero.classList.add("visual-image-ready");},()=>{state.hero="failed";hero.classList.add("visual-image-error");state.errors.push("hero");});}catch(e){state.hero="failed";state.errors.push("hero:"+e.message);}}
  function renderTile(tile){
    if(tile.dataset.visualState==="loading"||tile.dataset.visualState==="loaded")return;
    const key=Array.from(tile.classList).find(c=>/^pillar-(?:[1-9]|10)$/.test(c)),recipe=key&&ROM.tiles[key];
    if(!recipe){tile.dataset.visualState="failed";state.failed++;return;}
    tile.dataset.visualState="loading";tile.style.setProperty("--tile-accent",recipe.accent);
    tile.querySelectorAll(".visual-engine-tile-image,.tile-icon,.tile-copy").forEach(n=>n.remove());
    try{
      addImage(tile,recipe.asset,"visual-engine-tile-image",false,()=>{tile.dataset.visualState="loaded";tile.classList.add("visual-image-ready");state.loaded++;},()=>{tile.dataset.visualState="failed";tile.classList.add("visual-image-error");state.failed++;state.errors.push(key);});
      const icon=document.createElement("span");icon.className="tile-icon";icon.dataset.leonTileLabel="true";icon.setAttribute("aria-hidden","true");icon.textContent=recipe.icon;
      const copy=document.createElement("span");copy.className="tile-copy";copy.dataset.leonTileLabel="true";
      const small=document.createElement("small");small.textContent="Filar "+key.slice(7);
      const strong=document.createElement("strong");strong.textContent=recipe.title;
      const em=document.createElement("em");em.textContent=recipe.subtitle;
      copy.append(small,strong,em);tile.append(icon,copy);
    }catch(e){tile.dataset.visualState="failed";tile.classList.add("visual-image-error");state.failed++;state.errors.push(key+":"+e.message);}
  }
  function start(){
    if(state.started)return;state.started=true;
    if(!ROM||!ROM.tiles||!ROM.hero){state.errors.push("rom-missing");return;}
    renderHero();
    let observer=null;
    if("IntersectionObserver"in window)observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);renderTile(entry.target);}}),{rootMargin:"500px 0px",threshold:.01});
    tiles.forEach((tile,index)=>{if(index<2||!observer)renderTile(tile);else observer.observe(tile);});
    window.ModelPanstwaVisualEngine=Object.freeze({
      version:VERSION,
      getStatus(){return {version:VERSION,started:state.started,hero:state.hero,tiles:{total:tiles.length,loaded:state.loaded,failed:state.failed},errors:state.errors.slice(),renderer:"individual-svg-one-copy",assetRoot:ROOT.href};},
      retryFailed(){if(state.hero==="failed"){state.hero="idle";renderHero();}tiles.filter(t=>t.dataset.visualState==="failed").forEach(t=>{t.dataset.visualState="idle";renderTile(t);});}
    });
    window.dispatchEvent(new CustomEvent("model-panstwa:visual-ready",{detail:{version:VERSION,tiles:tiles.length}}));
    console.info("[Leon Visual Engine]",window.ModelPanstwaVisualEngine.getStatus());
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();