/* Leon Visual Engine 6.0 — native image compositor, independent from SVG recipe rendering. */
(() => {
  "use strict";
  const VERSION = "6.0.0";
  const script = document.currentScript;
  const ROOT = new URL("./menu/", script && script.src ? script.src : location.href);
  const hero = document.querySelector(".hero-banner");
  const tiles = Array.from(document.querySelectorAll(".pillar-tile"));
  const ROM = window.LeonVisualROM;
  const state = {
    version: VERSION, started: false, hero: hero ? "idle" : "missing",
    tiles: { total: tiles.length, loaded: 0, failed: 0, pending: 0 },
    assets: [], errors: [], startedAt: Date.now()
  };
  const safeAsset = value => typeof value === "string" &&
    /^[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|avif|svg)$/i.test(value);
  const urlFor = value => {
    if (!safeAsset(value)) throw new TypeError("asset-name-rejected");
    const url = new URL(value, ROOT);
    if (url.origin !== location.origin) throw new TypeError("cross-origin-asset-blocked");
    return url.href;
  };
  const recipes = ROM && ROM.tiles ? ROM.tiles : {};
  const record = (id, asset, reason) => {
    state.errors.push({ id, asset, reason, at: Date.now() });
    if (state.errors.length > 40) state.errors.shift();
  };
  const setAsset = (id, asset, status) => {
    state.assets = state.assets.filter(item => item.id !== id);
    state.assets.push({ id, asset, status });
  };
  function render(host, recipe, isHero) {
    const id = isHero ? "hero" : recipe.id;
    const old = host.querySelector(isHero ? ".visual-engine-image" : ".visual-engine-tile-image");
    if (old) old.remove();
    const stage = document.createElement("div");
    stage.className = isHero ? "visual-engine-image" : "visual-engine-tile-image";
    stage.setAttribute("aria-hidden", "true");
    stage.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:0;overflow:hidden;pointer-events:none;border-radius:inherit;";
    const img = document.createElement("img");
    img.alt = ""; img.draggable = false; img.decoding = "async";
    img.loading = isHero ? "eager" : "lazy";
    img.referrerPolicy = "no-referrer";
    img.style.cssText = "display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:" +
      (recipe.focal || "50% 50%") + ";";
    if (isHero && "fetchPriority" in img) img.fetchPriority = "high";
    img.addEventListener("load", () => {
      host.classList.add("visual-image-ready");
      host.classList.remove("visual-image-error");
      host.dataset.visualState = "loaded";
      setAsset(id, recipe.asset, "loaded");
      if (isHero) state.hero = "loaded";
      else {
        state.tiles.loaded++;
        state.tiles.pending = Math.max(0, state.tiles.pending - 1);
      }
    }, { once: true });
    img.addEventListener("error", () => {
      record(id, recipe.asset, "image-load-failed");
      setAsset(id, recipe.asset, "failed");
      host.classList.add("visual-image-error");
      host.dataset.visualState = "failed";
      if (isHero) state.hero = "error";
      else {
        state.tiles.failed++;
        state.tiles.pending = Math.max(0, state.tiles.pending - 1);
      }
    }, { once: true });
    stage.appendChild(img);
    host.prepend(stage);
    try { img.src = urlFor(recipe.asset); }
    catch (error) {
      record(id, recipe.asset, error.message || "invalid-asset");
      host.classList.add("visual-image-error");
      host.dataset.visualState = "failed";
      if (isHero) state.hero = "error";
      else {
        state.tiles.failed++;
        state.tiles.pending = Math.max(0, state.tiles.pending - 1);
      }
    }
  }
  function recipeFor(tile) {
    for (const key of Object.keys(recipes)) {
      if (tile.classList.contains(key)) return recipes[key];
    }
    return null;
  }
  function renderTile(tile) {
    if (tile.dataset.visualState === "loading" || tile.dataset.visualState === "loaded") return;
    const recipe = recipeFor(tile);
    if (!recipe || !safeAsset(recipe.asset)) {
      tile.dataset.visualState = "failed";
      tile.classList.add("visual-image-error");
      state.tiles.failed++;
      record("tile", recipe && recipe.asset, "recipe-or-asset-missing");
      return;
    }
    tile.dataset.visualState = "loading";
    tile.dataset.visualLoaded = "0";
    tile.style.setProperty("--tile-accent", recipe.accent || "#39a9ef");
    tile.style.setProperty("--tile-focal", recipe.focal || "50% 50%");
    tile.style.setProperty("--tile-shade-opacity", recipe.shade === "strong" ? "0.58" : "0.38");
    state.tiles.pending++;
    render(tile, recipe, false);
  }
  function start() {
    if (state.started) return;
    state.started = true;
    if (!ROM || !ROM.tiles || !ROM.hero) {
      record("engine", "visual-rom.js", "visual-rom-missing-or-invalid");
      state.hero = "error";
      tiles.forEach(tile => { tile.classList.add("visual-image-error"); tile.dataset.visualState = "failed"; });
      state.tiles.failed = tiles.length;
    } else {
      if (hero) {
        state.hero = "loading";
        render(hero, ROM.hero, true);
      }
      tiles.slice(0, 2).forEach(renderTile);
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            renderTile(entry.target);
          });
        }, { rootMargin: "600px 0px", threshold: 0.01 });
        tiles.slice(2).forEach(tile => observer.observe(tile));
      } else {
        tiles.slice(2).forEach(renderTile);
      }
    }
    window.ModelPanstwaVisualEngine = Object.freeze({
      version: VERSION,
      getStatus() {
        return {
          version: state.version, started: state.started, hero: state.hero,
          tiles: { ...state.tiles }, assets: state.assets.map(item => ({ ...item })),
          errors: state.errors.map(item => ({ ...item })), tileCount: tiles.length,
          recipeCount: Object.keys(recipes).length, renderer: "native-img",
          assetRoot: ROOT.href, rom: ROM && ROM.version || "missing"
        };
      },
      retryFailed() {
        if (hero && state.hero === "error" && ROM && ROM.hero) {
          state.hero = "loading"; render(hero, ROM.hero, true);
        }
        tiles.filter(tile => tile.dataset.visualState === "failed").forEach(tile => {
          tile.dataset.visualState = "idle";
          state.tiles.failed = Math.max(0, state.tiles.failed - 1);
          renderTile(tile);
        });
      }
    });
    window.dispatchEvent(new CustomEvent("model-panstwa:visual-ready", {
      detail: { version: VERSION, tiles: tiles.length, recipes: Object.keys(recipes).length }
    }));
    console.info("[Leon Visual Engine]", window.ModelPanstwaVisualEngine.getStatus());
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();