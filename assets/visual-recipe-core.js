/* Leon Visual Recipe Core 1.2 — deterministic multi-layer compositor.
   Fixed source files + explicit layer geometry = reproducible artwork.
   No random generation, remote calls, or runtime dependencies. */
(() => {
  "use strict";
  const VERSION = "1.2.0";
  const SAFE_ASSET = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9_./-]+\.(?:svg|webp|png|jpe?g)$/i;
  const BLENDS = new Set(["normal","multiply","screen","overlay","soft-light","hard-light","darken","lighten"]);
  const POS = /^(?:\d{1,3}%|left|center|right)\s+(?:\d{1,3}%|top|center|bottom)$/;

  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
  }
  function fingerprint(value) {
    const s = stableStringify(value); let h = 2166136261;
    for (let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(16).padStart(8,"0");
  }
  function assetURL(path, base) {
    if (typeof path !== "string" || !SAFE_ASSET.test(path)) throw new TypeError("unsafe-or-invalid-asset");
    const url = new URL(path, base);
    if (url.origin !== location.origin) throw new TypeError("cross-origin-asset-blocked");
    return url.href;
  }
  function normalizeLayer(layer) {
    if (!layer || typeof layer !== "object") throw new TypeError("invalid-layer");
    const opacity = Number.isFinite(layer.opacity) ? Math.min(1,Math.max(0,layer.opacity)) : 1;
    const blend = BLENDS.has(layer.blend) ? layer.blend : "normal";
    const focal = typeof layer.focal === "string" && POS.test(layer.focal) ? layer.focal : "50% 50%";
    const fit = layer.fit === "contain" ? "contain" : "cover";
    if (layer.type === "image") return Object.freeze({type:"image",asset:layer.asset,opacity,blend,focal,fit});
    if (layer.type === "gradient") {
      if (typeof layer.value !== "string" || !/^(?:linear|radial)-gradient\([#(),.%\w\s-]+\)$/i.test(layer.value)) throw new TypeError("invalid-gradient");
      return Object.freeze({type:"gradient",value:layer.value,opacity,blend});
    }
    throw new TypeError("unsupported-layer-type");
  }
  function validateRecipe(recipe) {
    if (!recipe || typeof recipe !== "object") throw new TypeError("recipe-required");
    const layers = Array.isArray(recipe.layers) ? recipe.layers.map(normalizeLayer) :
      [normalizeLayer({type:"image",asset:recipe.asset,focal:recipe.focal,fit:recipe.fit,opacity:1})];
    if (!layers.length || layers.length > 16) throw new RangeError("layer-count-out-of-range");
    for (const layer of layers) if(layer.type==="image" && (typeof layer.asset!=="string" || !SAFE_ASSET.test(layer.asset))) throw new TypeError("unsafe-or-invalid-asset");
    return Object.freeze({
      id: typeof recipe.id==="string" ? recipe.id.slice(0,64) : "unnamed",
      width: Number.isFinite(recipe.width) ? Math.max(1,Math.min(8192,Math.round(recipe.width))) : null,
      height: Number.isFinite(recipe.height) ? Math.max(1,Math.min(8192,Math.round(recipe.height))) : null,
      layers:Object.freeze(layers),
      accent:typeof recipe.accent==="string" && /^#[0-9a-f]{6}$/i.test(recipe.accent) ? recipe.accent : "#39a9ef",
      alt:typeof recipe.alt==="string" ? recipe.alt : ""
    });
  }
  function renderRecipe(host,input,options) {
    if (!(host instanceof Element)) throw new TypeError("render-target-required");
    const recipe=validateRecipe(input), opts=options||{};
    const base=opts.baseURL instanceof URL ? opts.baseURL : new URL("./",document.currentScript?document.currentScript.src:location.href);
    const stage=document.createElement("div");
    stage.className=opts.className||"leon-recipe-stage";
    stage.setAttribute("aria-hidden",recipe.alt?"false":"true");
    stage.dataset.recipeHash=fingerprint(recipe);
    stage.style.cssText="position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;border-radius:inherit;";
    let pending=0,failed=0;
    recipe.layers.forEach((layer,index)=>{
      const node=document.createElement("div");
      node.style.cssText="position:absolute;inset:0;width:100%;height:100%;opacity:"+layer.opacity+";mix-blend-mode:"+layer.blend+";";
      node.style.zIndex=String(index);
      if(layer.type==="gradient"){node.style.backgroundImage=layer.value;}
      else {
        const img=document.createElement("img");
        img.alt="";img.draggable=false;img.decoding="async";img.loading=opts.priority?"eager":"lazy";
        if(opts.priority && "fetchPriority" in img) img.fetchPriority="high";
        img.style.cssText="display:block;width:100%;height:100%;max-width:none;object-fit:"+layer.fit+";object-position:"+layer.focal+";";
        pending++;
        img.addEventListener("load",()=>{pending--;if(!pending&&!failed){host.classList.add("visual-image-ready");host.classList.remove("visual-image-error");if(typeof opts.onLoad==="function")opts.onLoad(stage,recipe);}}, {once:true});
        img.addEventListener("error",()=>{failed++;pending--;node.remove();host.classList.add("visual-image-error");if(typeof opts.onError==="function")opts.onError(img.src,recipe);},{once:true});
        img.src=assetURL(layer.asset,base);node.appendChild(img);
      }
      stage.appendChild(node);
    });
    host.prepend(stage);
    if(!pending){host.classList.add("visual-image-ready");if(typeof opts.onLoad==="function")opts.onLoad(stage,recipe);}
    return Object.freeze({stage,recipe,hash:fingerprint(recipe)});
  }
  function render(host,input,options) {
    const recipe=validateRecipe(input);
    return renderRecipe(host,{id:"legacy-single-image",layers:recipe.layers,accent:recipe.accent,alt:recipe.alt},options);
  }
  window.LeonVisualRecipeCore=Object.freeze({version:VERSION,validateRecipe,fingerprint,stableStringify,render,renderRecipe});
})();