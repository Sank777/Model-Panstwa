(() => {
  "use strict";
  /* Leon Visual Engine 5.0: deterministic local assets, one image layer, lazy loading. */
  const VERSION="5.1.0";
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
  const NS="http://www.w3.org/2000/svg";
  const GEOMETRY=[
    [[48,145],[112,82],[178,145],[246,82],[320,145]],
    [[52,150],[105,112],[160,74],[220,112],[285,55],[342,88]],
    [[72,62],[72,150],[200,150],[200,62],[328,62],[328,150]],
    [[80,145],[80,88],[160,88],[160,145],[240,145],[240,88],[320,88]],
    [[62,140],[120,80],[200,140],[280,80],[338,140]],
    [[72,150],[72,115],[140,115],[140,72],[210,72],[210,130],[280,130],[280,55],[340,55]],
    [[58,120],[120,70],[180,120],[240,70],[302,120],[342,70]],
    [[65,75],[130,75],[130,145],[200,145],[200,75],[270,75],[270,145],[335,145]],
    [[75,135],[115,75],[155,135],[200,75],[245,135],[290,75],[330,135]],
    [[62,145],[115,110],[168,125],[220,70],[275,92],[338,48]]
  ];
  const ACCENTS=["#ff4964","#36a9ff","#ffd34e","#56d99a","#bd72ff","#37d9e8","#319cff","#f04dbb","#ff9c45","#35d9b4"];
  function addGeometry(tile){
    if(tile.querySelector(".visual-engine-geometry"))return;
    const match=tile.className.match(/pillar-(10|[1-9])(?:\\s|$)/);
    if(!match)return;
    const index=Number(match[1])-1,points=GEOMETRY[index];
    const svg=document.createElementNS(NS,"svg");
    svg.setAttribute("class","visual-engine-geometry");svg.setAttribute("viewBox","0 0 400 220");
    svg.setAttribute("preserveAspectRatio","xMidYMid slice");svg.setAttribute("aria-hidden","true");
    svg.setAttribute("focusable","false");
    const poly=document.createElementNS(NS,"polyline");
    poly.setAttribute("points",points.map(p=>p.join(",")).join(" "));
    poly.setAttribute("fill","none");poly.setAttribute("stroke",ACCENTS[index]);
    poly.setAttribute("stroke-width","2.2");poly.setAttribute("stroke-linecap","round");
    poly.setAttribute("stroke-linejoin","round");poly.setAttribute("opacity",".36");
    svg.appendChild(poly);
    points.forEach(([x,y],i)=>{
      if(i%2!==0)return;
      const circle=document.createElementNS(NS,"circle");
      circle.setAttribute("cx",String(x));circle.setAttribute("cy",String(y));
      circle.setAttribute("r","4.2");circle.setAttribute("fill",ACCENTS[index]);
      circle.setAttribute("stroke","#eaf6ff");circle.setAttribute("stroke-width","1");
      circle.setAttribute("opacity",".55");svg.appendChild(circle);
    });
    tile.style.setProperty("--tile-accent",ACCENTS[index]);
    tile.prepend(svg);
  }
  function loadTile(tile){
    if(tile.dataset.visualLoaded==="1")return;
    const name=sceneFor(tile);
    if(!name){tile.classList.add("visual-image-error");fail("tile-mapping",tile.className,"missing-scene-map");return;}
    tile.dataset.visualLoaded="1";state.tiles.pending++;addGeometry(tile);
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