/* Leon Visual Engine 6.12.2 — persistent, fail-open renderer.
   Visual rendering, page integrity and diagnostics remain independent. */
(() => {
  "use strict";
  const VERSION = "6.12.2";
  if (window.__LEON_VISUAL_ENGINE_INSTANCE__) return;
  window.__LEON_VISUAL_ENGINE_INSTANCE__ = VERSION;

  const script = document.currentScript;
  const ROOT = new URL("./", script && script.src ? script.src : location.href);
  const ROM = window.LeonVisualROM;
  const state = { started:false, hero:"pending", total:0, loaded:0, fallback:0, errors:[], lastCheck:0 };
  const cache = new Map();
  let observer = null;
  let watchdog = null;

  function assetURL(path) {
    if (typeof path !== "string" || !/^[a-z0-9_/-]+\.(?:webp|png|jpe?g|svg)$/i.test(path) ||
        path.split("/").some(part => part === "." || part === "..")) throw new Error("asset-path-rejected");
    const url = new URL(path, ROOT);
    if (url.origin !== location.origin || !url.pathname.startsWith(ROOT.pathname)) throw new Error("asset-origin-rejected");
    return url.href;
  }
  function load(path) {
    const url = assetURL(path);
    if (!cache.has(url)) {
      const promise = new Promise((resolve,reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("asset-not-found:" + path));
        img.src = url;
      }).catch(error => { cache.delete(url); throw error; });
      cache.set(url,promise);
    }
    return cache.get(url);
  }
  function directChild(host, cls) {
    return Array.from(host.children).find(node => node.classList && node.classList.contains(cls)) || null;
  }
  function renderHero() {
    const hero = document.querySelector(".hero-banner");
    if (!hero) return Promise.resolve();
    const recipe = ROM && ROM.hero;
    if (!recipe) { hero.classList.add("visual-hero-fallback"); state.hero = "fallback"; return Promise.resolve(); }
    hero.dataset.visualState = "loading";
    return load(recipe.asset).then(() => {
      let layer = directChild(hero,"visual-engine-image");
      if (!layer) {
        layer = document.createElement("div");
        layer.className = "visual-engine-image";
        layer.setAttribute("aria-hidden","true");
        const img = document.createElement("img");
        img.alt = "";
        img.decoding = "async";
        img.loading = "eager";
        img.referrerPolicy = "no-referrer";
        img.src = assetURL(recipe.asset);
        layer.appendChild(img);
        hero.insertBefore(layer,hero.firstChild);
      }
      hero.style.setProperty("--leon-hero-focus", recipe.focal || "50% 50%");
      const heroImage = layer.querySelector("img");
      if (heroImage) heroImage.style.objectPosition = recipe.focal || "50% 50%";
      hero.classList.remove("visual-hero-fallback","visual-image-error");
      hero.classList.add("visual-hero-ready");
      hero.dataset.visualState = "loaded";
      state.hero = "loaded";
    }).catch(error => {
      hero.classList.add("visual-hero-fallback","visual-image-error");
      hero.dataset.visualState = "fallback";
      state.hero = "fallback";
      record("hero",error);
    });
  }
  function getTileKey(tile) {
    return Array.from(tile.classList).find(name => /^pillar-(?:[1-9]|10)$/.test(name));
  }
  function renderFallback(tile, recipe, error) {
    const key = getTileKey(tile);
    const oldLayer = directChild(tile,"visual-engine-tile-image");
    if (oldLayer) oldLayer.remove();
    tile.classList.add("visual-tile-fallback","visual-image-error");
    tile.dataset.visualState = "fallback";
    let icon = directChild(tile,"tile-icon");
    let copy = directChild(tile,"tile-copy");
    if (!icon) { icon = document.createElement("span"); icon.className = "tile-icon"; tile.appendChild(icon); }
    if (!copy) { copy = document.createElement("span"); copy.className = "tile-copy"; tile.appendChild(copy); }
    icon.textContent = recipe.icon || "◆";
    icon.setAttribute("aria-hidden","true");
    const number = document.createElement("small");
    number.textContent = "Filar " + String(key || "").replace("pillar-","");
    const title = document.createElement("strong");
    title.textContent = recipe.title || "Obszar rozwoju państwa";
    const subtitle = document.createElement("em");
    subtitle.textContent = recipe.subtitle || "";
    copy.replaceChildren(number,title,subtitle);
    record(key || "tile",error);
  }
  function renderTile(tile) {
    const key = getTileKey(tile);
    const recipe = key && ROM && ROM.tiles && ROM.tiles[key];
    if (!recipe) {
      tile.classList.add("visual-tile-fallback");
      tile.dataset.visualState = "fallback";
      record(key || "tile","missing-rom-recipe");
      return Promise.resolve();
    }
    if (tile.dataset.visualState === "loaded" || tile.dataset.visualState === "loading") return Promise.resolve();
    tile.dataset.visualState = "loading";
    tile.style.setProperty("--tile-accent",recipe.accent || "#39a9ef");
    return load(recipe.asset).then(() => {
      let layer = directChild(tile,"visual-engine-tile-image");
      if (!layer) {
        layer = document.createElement("div");
        layer.className = "visual-engine-tile-image";
        layer.setAttribute("aria-hidden","true");
        tile.insertBefore(layer,tile.firstChild);
      }
      layer.style.backgroundImage = 'url("' + assetURL(recipe.asset) + '")';
      layer.style.backgroundRepeat = "no-repeat";
      if (Number.isInteger(recipe.spriteIndex)) {
        const col = recipe.spriteIndex % 5, row = Math.floor(recipe.spriteIndex / 5);
        layer.style.setProperty("background-size", "500% 200%", "important");
        layer.style.setProperty("background-position", (col * 25) + "% " + (row * 100) + "%", "important");
      } else {
        layer.style.backgroundSize = "cover";
        layer.style.backgroundPosition = recipe.focal || "center";
      }
      tile.classList.remove("visual-tile-fallback","visual-image-error");
      tile.dataset.visualState = "loaded";
      state.loaded++;
    }).catch(error => renderFallback(tile,recipe,error));
  }
  function record(source,error) {
    const message = source + ":" + (error && error.message ? error.message : String(error));
    if (!state.errors.includes(message)) state.errors.push(message);
    if (state.errors.length > 30) state.errors.shift();
  }
  function scan() {
    state.lastCheck = Date.now();
    const hero = document.querySelector(".hero-banner");
    if (hero && !["loaded","loading","fallback"].includes(hero.dataset.visualState)) renderHero();
    document.querySelectorAll(".pillar-tile").forEach(tile => {
      if (!["loaded","loading","fallback"].includes(tile.dataset.visualState)) renderTile(tile);
    });
    state.total = document.querySelectorAll(".pillar-tile").length;
  }
  function getStatus() {
    const tiles = Array.from(document.querySelectorAll(".pillar-tile"));
    return Object.freeze({
      version:VERSION, rom:ROM ? ROM.version : "missing", running:state.started,
      hero:state.hero, tiles:{total:tiles.length,loaded:tiles.filter(x=>x.dataset.visualState==="loaded").length,
      fallback:tiles.filter(x=>x.dataset.visualState==="fallback").length},
      errors:state.errors.slice(), lastCheck:new Date(state.lastCheck).toISOString(),
      renderer:"persistent-fail-open-local-rom"
    });
  }
  function retryFailed() {
    document.querySelectorAll(".pillar-tile.visual-tile-fallback").forEach(tile => { tile.dataset.visualState = "idle"; });
    const hero = document.querySelector(".hero-banner");
    if (hero) { hero.classList.remove("visual-hero-ready","visual-hero-fallback","visual-image-error"); hero.dataset.visualState = "idle"; }
    state.hero = "pending";
    scan();
    return Promise.resolve(getStatus());
  }
  function start() {
    if (state.started) return;
    state.started = true;
    window.ModelPanstwaVisualEngine = Object.freeze({version:VERSION,getStatus,retryFailed,scan});
    scan();
    if (window.MutationObserver) {
      observer = new MutationObserver(records => {
        if (document.hidden) return;
        const addedVisualHost = records.some(record => Array.from(record.addedNodes).some(node =>
          node.nodeType === 1 && (node.matches?.(".pillar-tile,.hero-banner") || node.querySelector?.(".pillar-tile,.hero-banner"))
        ));
        if (addedVisualHost) scan();
      });
      observer.observe(document.querySelector(".dashboard-home") || document.body,{childList:true,subtree:true});
    }
    watchdog = window.setInterval(() => {
      if (!document.hidden) scan();
    },30000);
    window.addEventListener("pagehide",() => {
      if (observer) observer.disconnect();
      if (watchdog) window.clearInterval(watchdog);
    },{once:true});
    console.info("[Leon Visual Engine]",getStatus());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();