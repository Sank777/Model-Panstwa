/* Leon Visual Engine 7.2.1 — validated local atlas renderer. */
(() => {
  "use strict";
  const VERSION="7.2.1";
  if (window.__LEON_VISUAL_ENGINE_INSTANCE__) return;
  window.__LEON_VISUAL_ENGINE_INSTANCE__=VERSION;
  const script=document.currentScript;
  const ROOT=new URL("./",script&&script.src?script.src:location.href);
  const ROM=window.LeonVisualROM;
  const state={started:false,hero:"pending",errors:[],lastCheck:0,pending:new Set()};
  const imageCache=new Map(),segmentCache=new Map(),objectURLs=new Map();
  let observer=null,watchdog=null;

  function assetURL(path){
    if(typeof path!=="string"||! /^[a-z0-9_/-]+\.(?:webp|png|jpe?g|svg)$/i.test(path)||path.split("/").some(part=>part==="."||part==="..")) throw new Error("asset-path-rejected");
    const url=new URL(path,ROOT);
    if(url.origin!==location.origin||!url.pathname.startsWith(ROOT.pathname)) throw new Error("asset-origin-rejected");
    return url.href;
  }
  function load(path){
    const url=assetURL(path);
    if(!imageCache.has(url)){
      const promise=new Promise((resolve,reject)=>{
        const img=new Image(); img.decoding="async"; img.referrerPolicy="no-referrer";
        img.onload=()=>resolve(img); img.onerror=()=>reject(new Error("asset-not-found:"+path)); img.src=url;
      }).catch(error=>{imageCache.delete(url);throw error;});
      imageCache.set(url,promise);
    }
    return imageCache.get(url);
  }
  function directChild(host,cls){return Array.from(host.children).find(node=>node.classList&&node.classList.contains(cls))||null;}
  function setImageSource(image,src){
    if(image.complete&&image.naturalWidth>0&&image.src===src) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const cleanup=()=>{image.removeEventListener("load",onLoad);image.removeEventListener("error",onError);};
      const onLoad=()=>{cleanup();if(image.naturalWidth>0&&image.naturalHeight>0)resolve();else reject(new Error("image-decode-empty"));};
      const onError=()=>{cleanup();reject(new Error("image-render-load-failed"));};
      image.addEventListener("load",onLoad,{once:true});image.addEventListener("error",onError,{once:true});
      image.src=src;
      if(image.complete){if(image.naturalWidth>0&&image.naturalHeight>0){cleanup();resolve();}else{cleanup();reject(new Error("image-render-load-failed"));}}
    }).then(()=>typeof image.decode==="function"?image.decode():undefined);
  }
  function record(source,error){
    const message=source+":"+(error&&error.message?error.message:String(error));
    if(!state.errors.includes(message)) state.errors.push(message);
    if(state.errors.length>30) state.errors.shift();
  }
  function resolveMode(recipe){
    let mode=recipe.mode||"auto";
    if(mode==="auto"){
      if(Array.isArray(recipe.regions)) mode="regions";
      else if(recipe.grid||Number.isInteger(recipe.spriteIndex)) mode="grid";
      else mode="single";
    }
    return mode;
  }
  function segmentConfig(recipe,mode){
    if(mode==="grid") return recipe.grid||ROM.spriteGrid||{columns:5,rows:2};
    if(mode==="regions") return {mode:"regions",regions:recipe.regions};
    return {mode:"single"};
  }
  function getSegment(path,recipe,source){
    const mode=resolveMode(recipe),config=segmentConfig(recipe,mode);
    const key=path+"|"+mode+"|"+JSON.stringify(config);
    if(!segmentCache.has(key)){
      const promise=window.LeonVisualSegmenter.extract(source,{...config,mode})
        .catch(error=>{segmentCache.delete(key);throw error;});
      segmentCache.set(key,promise);
    }
    return segmentCache.get(key);
  }
  function blobURL(key,blob){
    if(!objectURLs.has(key)) objectURLs.set(key,URL.createObjectURL(blob));
    return objectURLs.get(key);
  }
  function setImageFit(image,recipe){
    image.style.objectFit=recipe.fit==="cover"?"cover":recipe.fit==="fill"?"fill":"contain";
    if(recipe.focal) image.style.objectPosition=recipe.focal;
  }
  function renderHero(){
    const hero=document.querySelector(".hero-banner");
    if(!hero)return Promise.resolve();
    const recipe=ROM&&ROM.hero;
    if(!recipe){hero.classList.add("visual-hero-fallback");state.hero="fallback";return Promise.resolve();}
    hero.dataset.visualState="loading";
    const task=load(recipe.asset).then(async source=>{
      let layer=directChild(hero,"visual-engine-image");
      if(!layer){layer=document.createElement("div");layer.className="visual-engine-image";layer.setAttribute("aria-hidden","true");const img=document.createElement("img");img.alt="";img.decoding="async";img.loading="eager";layer.appendChild(img);hero.insertBefore(layer,hero.firstChild);}
      const img=layer.querySelector("img");setImageFit(img,recipe);await setImageSource(img,source.currentSrc||assetURL(recipe.asset));
      hero.style.setProperty("--leon-hero-focus",recipe.focal||"50% 50%");
      hero.classList.remove("visual-hero-fallback","visual-image-error");hero.classList.add("visual-hero-ready");hero.dataset.visualState="loaded";state.hero="loaded";
    }).catch(error=>{hero.classList.add("visual-hero-fallback","visual-image-error");hero.dataset.visualState="fallback";state.hero="fallback";record("hero",error);});
    state.pending.add(task);return task.finally(()=>state.pending.delete(task));
  }
  function tileKey(tile){return Array.from(tile.classList).find(name=>/^pillar-(?:[1-9]|10)$/.test(name));}
  function renderFallback(tile,recipe,error){
    const key=tileKey(tile),old=directChild(tile,"visual-engine-tile-image");if(old)old.remove();
    tile.classList.remove("visual-image-ready");tile.classList.add("visual-tile-fallback","visual-image-error");tile.dataset.visualState="fallback";tile.dataset.visualValidation="failed";
    let icon=directChild(tile,"tile-icon"),copy=directChild(tile,"tile-copy");
    if(!icon){icon=document.createElement("span");icon.className="tile-icon";tile.appendChild(icon);}
    if(!copy){copy=document.createElement("span");copy.className="tile-copy";tile.appendChild(copy);}
    icon.textContent=recipe.icon||"◆";icon.setAttribute("aria-hidden","true");
    const number=document.createElement("small");number.textContent="Filar "+String(key||"").replace("pillar-","");
    const title=document.createElement("strong");title.textContent=recipe.title||"Obszar rozwoju państwa";
    const subtitle=document.createElement("em");subtitle.textContent=recipe.subtitle||"";copy.replaceChildren(number,title,subtitle);
    record(key||"tile",error);
  }
  function renderTile(tile){
    const key=tileKey(tile),recipe=key&&ROM&&ROM.tiles&&ROM.tiles[key];
    if(!recipe){renderFallback(tile,{icon:"◆",title:"Obszar rozwoju państwa",subtitle:"Grafika chwilowo niedostępna"},"missing-rom-recipe");return Promise.resolve();}
    if(tile.dataset.visualState==="rendered"||tile.dataset.visualState==="loaded"||tile.dataset.visualState==="loading")return Promise.resolve();
    tile.dataset.visualState="loading";tile.style.setProperty("--tile-accent",recipe.accent||"#39a9ef");
    const task=load(recipe.asset).then(async source=>{
      let layer=directChild(tile,"visual-engine-tile-image");
      if(!layer){layer=document.createElement("img");layer.className="visual-engine-tile-image";layer.alt="";layer.decoding="async";layer.loading="eager";layer.draggable=false;layer.setAttribute("aria-hidden","true");tile.insertBefore(layer,tile.firstChild);}
      const mode=resolveMode(recipe);
      let imageSource;
      if(mode==="single"){
        imageSource=source.currentSrc||assetURL(recipe.asset);
      }else{
        const segments=await getSegment(recipe.asset,recipe,source);
        const index=Number.isInteger(recipe.regionIndex)?recipe.regionIndex:recipe.spriteIndex;
        const segment=segments[index];
        if(!segment)throw new Error("segment-index-out-of-range:"+index);
        if(!segment.blob||segment.width<=0||segment.height<=0)throw new Error("segment-validation-failed:"+index);
        tile.dataset.visualAsset=recipe.asset;
        tile.dataset.visualSegment=String(index);
        tile.dataset.visualSourceDimensions=source.naturalWidth+"x"+source.naturalHeight;
        imageSource=blobURL(recipe.asset+"|"+mode+"|"+index+"|"+JSON.stringify({x:segment.x,y:segment.y,width:segment.width,height:segment.height}),segment.blob);
      }
      setImageFit(layer,recipe);
      await setImageSource(layer,imageSource);
      tile.dataset.visualValidation="passed";
      tile.dataset.visualAsset=recipe.asset;
      tile.classList.remove("visual-tile-fallback","visual-image-error");tile.classList.add("visual-image-ready");tile.dataset.visualState="rendered";
    }).catch(error=>renderFallback(tile,recipe,error));
    state.pending.add(task);return task.finally(()=>state.pending.delete(task));
  }
  function scan(){
    state.lastCheck=Date.now();
    const hero=document.querySelector(".hero-banner");
    if(hero&& !["loaded","loading","fallback"].includes(hero.dataset.visualState))renderHero();
    document.querySelectorAll(".pillar-tile").forEach(tile=>{if(!["rendered","loaded","loading","fallback"].includes(tile.dataset.visualState))renderTile(tile);});
  }
  function getStatus(){
    const tiles=Array.from(document.querySelectorAll(".pillar-tile"));
    return Object.freeze({version:VERSION,rom:ROM?ROM.version:"missing",segmenter:window.LeonVisualSegmenter?window.LeonVisualSegmenter.version:"missing",
      running:state.started,hero:state.hero,tiles:{total:tiles.length,loaded:tiles.filter(x=>x.dataset.visualState==="loaded"||x.dataset.visualState==="rendered").length,validated:tiles.filter(x=>x.dataset.visualValidation==="passed").length,rendered:tiles.filter(x=>x.dataset.visualState==="rendered").length,fallback:tiles.filter(x=>x.dataset.visualState==="fallback").length},
      pending:state.pending.size,errors:state.errors.slice(),lastCheck:state.lastCheck?new Date(state.lastCheck).toISOString():null,renderer:"universal-local-single-grid-regions"});
  }
  async function retryFailed(){
    document.querySelectorAll(".pillar-tile.visual-tile-fallback").forEach(tile=>{tile.dataset.visualState="idle";});
    const hero=document.querySelector(".hero-banner");if(hero){hero.classList.remove("visual-hero-ready","visual-hero-fallback","visual-image-error");hero.dataset.visualState="idle";}
    state.hero="pending";scan();
    while(state.pending.size)await Promise.allSettled(Array.from(state.pending));
    return getStatus();
  }
  function start(){
    if(state.started)return;state.started=true;
    window.ModelPanstwaVisualEngine=Object.freeze({version:VERSION,getStatus,retryFailed,scan,analyzeImage:source=>window.LeonVisualSegmenter.analyze(source)});
    scan();
    if(window.MutationObserver){observer=new MutationObserver(records=>{
      if(document.hidden)return;
      const added=records.some(record=>Array.from(record.addedNodes).some(node=>node.nodeType===1&&(node.matches?.(".pillar-tile,.hero-banner")||node.querySelector?.(".pillar-tile,.hero-banner"))));
      if(added)scan();
    });observer.observe(document.querySelector(".dashboard-home")||document.body,{childList:true,subtree:true});}
    watchdog=window.setInterval(()=>{if(!document.hidden)scan();},30000);
    window.addEventListener("pagehide",()=>{
      if(observer)observer.disconnect();if(watchdog)window.clearInterval(watchdog);
      objectURLs.forEach(url=>URL.revokeObjectURL(url));objectURLs.clear();
    },{once:true});
    console.info("[Leon Visual Engine]",getStatus());
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
