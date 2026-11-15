(() => {
  "use strict";
  /* Leon Visual Engine 5.0: deterministic local assets, one image layer, lazy loading. */
  const VERSION="5.0.0";
  const ROOT=new URL("./menu/",document.currentScript.src);
  const hero=document.querySelector(".hero-banner");
  const tiles=Array.from(document.querySelectorAll(".pillar-tile"));
  const SCENES=Object.freeze({
    "pillar-1":"leon-filar-01-fundament.svg","pillar-2":"leon-filar-02-gospodarka.svg",
    "pillar-3":"leon-filar-03-prawo.svg","pillar-4":"leon-filar-04-bezpieczenstwo.svg",
    "pillar-5":"leon-filar-05-emerytury.svg","pillar-6":"leon-filar-06-kapital-ludzki.svg",
    "pillar-7":"leon-filar-07-strategia.svg","pillar-8":"leon-filar-08-informacje.svg",
    "pillar-9":"leon-filar-09-demografia.svg","pillar-10":"leon-filar-10-finanse.svg"
  });
  const state={version:VERSION,hero:hero?"waiting":"missing",tiles:{total:tiles.length,loaded:0,failed:0,pending:0},errors:[]};
  const url=name=>new URL(name,ROOT).href;
  function fail(target,src,reason){
    state.errors.push({target,src,reason});
    if(state.errors.length>20)state.errors.shift();
  }
  function mount(host,name,className,priority,label){
    const src=url(name),img=document.createElement("img");
    img.className=className;img.alt="";img.setAttribute("aria-hidden","true");
    img.setAttribute("draggable","false");img.decoding="async";
    img.loading=priority?"eager":"lazy";
    if(priority&&"fetchPriority" in img)img.fetchPriority="high";
    img.addEventListener("load",()=>{
      host.classList.add("visual-image-ready");host.classList.remove("visual-image-error");
      if(priority)state.hero="loaded";
      else{state.tiles.loaded++;state.tiles.pending=Math.max(0,state.tiles.pending-1);}
    },{once:true});
    img.addEventListener("error",()=>{
      img.remove();host.classList.add("visual-image-error");fail(label,src,"asset-unavailable");
      if(priority)state.hero="error";
      else{state.tiles.failed++;state.tiles.pending=Math.max(0,state.tiles.pending-1);}
    },{once:true});
    host.prepend(img);img.src=src;
  }
  if(hero){hero.classList.add("visual-engine-active");state.hero="loading";mount(hero,"polska-hero.webp","visual-engine-image",true,"hero");}
  function sceneFor(tile){
    for(const key of Object.keys(SCENES))if(tile.classList.contains(key))return SCENES[key];
    return null;
  }
  function loadTile(tile){
    if(tile.dataset.visualLoaded==="1")return;
    const name=sceneFor(tile);
    if(!name){tile.classList.add("visual-image-error");fail("tile-mapping",tile.className,"missing-scene-map");return;}
    tile.dataset.visualLoaded="1";state.tiles.pending++;
    mount(tile,name,"visual-engine-tile-image",false,tile.className);
  }
  tiles.slice(0,2).forEach(loadTile);
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);loadTile(entry.target);}
    },{rootMargin:"650px 0px",threshold:0.01});
    tiles.slice(2).forEach(tile=>observer.observe(tile));
  }else tiles.slice(2).forEach(loadTile);
  window.ModelPanstwaVisualEngine=Object.freeze({
    version:VERSION,
    getStatus(){return{version:state.version,hero:state.hero,tiles:{...state.tiles},errors:state.errors.map(x=>({...x})),tileCount:tiles.length};},
    getScenes(){return Object.keys(SCENES);}
  });
})();