(() => {
  "use strict";
  const VERSION = "5.8.0";
  const ROOT = new URL("./menu/", document.currentScript.src);
  const hero = document.querySelector(".hero-banner");
  const tiles = Array.from(document.querySelectorAll(".pillar-tile"));
  const ROM = window.LeonVisualROM;
  if (!ROM || ROM.version !== "1.2.0") {
    console.error("[Leon Visual Engine] Missing or incompatible visual ROM.");
    return;
  }
  const RECIPES = ROM.tiles;
  const state = {
    version: VERSION, hero: hero ? "waiting" : "missing",
    tiles: { total: tiles.length, loaded: 0, failed: 0, pending: 0 },
    errors: [], assets: [], startedAt: Date.now()
  };
  const assetURL = name => new URL(name, ROOT).href;
  function recipeFor(tile) {
    for (const key in RECIPES) if (tile.classList.contains(key)) return RECIPES[key];
    return null;
  }
  function recordError(target, url, reason) {
    state.errors.push({ target, url, reason, at: Date.now() });
    if (state.errors.length > 30) state.errors.shift();
  }
  function renderImage(host, recipe, isHero, attempt = 0) {
    const core = window.LeonVisualRecipeCore;
    if (!core) {
      recordError(isHero ? "hero" : host.className, recipe.asset, "recipe-core-missing");
      host.classList.add("visual-image-error");
      if (isHero) state.hero = "error";
      else finishTile(host, false);
      return;
    }
    const old = host.querySelector(":scope > .visual-engine-image, :scope > .visual-engine-tile-image");
    if (old) old.remove();
    const shade = Number.parseFloat(host.style.getPropertyValue("--tile-shade-opacity")) || 0;
    try {
      core.render(host, {
        id: isHero ? "hero" : recipe.id,
        asset: recipe.asset, focal: recipe.focal || "50% 50%", fit: "cover",
        accent: recipe.accent || "#39a9ef",
        alt: recipe.alt || ""
      }, {
        baseURL: ROOT, className: isHero ? "visual-engine-image" : "visual-engine-tile-image",
        priority: isHero,
        onLoad() {
          host.classList.add("visual-image-ready");
          host.classList.remove("visual-image-error");
          if (isHero) state.hero = "loaded";
          else finishTile(host, true);
        },
        onError(src) {
          recordError(isHero ? "hero" : host.className, src, "asset-unavailable");\n          state.assets = state.assets.filter(item => item.id !== (isHero ? "hero" : recipe.id));\n          state.assets.push({ id: isHero ? "hero" : recipe.id, asset: recipe.asset, status: "failed" });
          if (attempt < 1) {
            host.dataset.visualState = "retrying";
            window.setTimeout(() => renderImage(host, recipe, isHero, attempt + 1), 700);
          } else {
            host.classList.add("visual-image-error");
            if (isHero) state.hero = "error";
            else finishTile(host, false);
          }
        }
      });
    } catch (error) {
      recordError(isHero ? "hero" : host.className, recipe.asset,
        error && error.message ? error.message : "recipe-invalid");
      host.classList.add("visual-image-error");
      if (isHero) state.hero = "error";
      else finishTile(host, false);
    }
  }
  function finishTile(tile, success) {
    tile.dataset.visualState = success ? "loaded" : "failed";
    tile.dataset.visualLoaded = success ? "1" : "0";
    if (success) state.tiles.loaded++;
    else state.tiles.failed++;
    state.tiles.pending = Math.max(0, state.tiles.pending - 1);
  }
  function renderTile(tile) {
    if (tile.dataset.visualState === "loading" || tile.dataset.visualState === "loaded") return;
    const recipe = recipeFor(tile);
    if (!recipe) {
      tile.dataset.visualState = "failed";
      tile.classList.add("visual-image-error");
      state.tiles.failed++;
      recordError("tile-recipe", tile.className, "recipe-not-found");
      return;
    }
    tile.dataset.visualState = "loading";
    tile.dataset.visualLoaded = "0";
    tile.dataset.visualRecipe = ROM.version;
    tile.style.setProperty("--tile-accent", recipe.accent);
    tile.style.setProperty("--tile-focal", recipe.focal || "50% 50%");
    tile.style.setProperty("--tile-shade-opacity", recipe.shade === "strong" ? "0.58" : "0.38");
    state.tiles.pending++;
    renderImage(tile, recipe, false);
  }
  if (hero) {
    hero.classList.add("visual-engine-active");
    state.hero = "loading";
    renderImage(hero, ROM.hero, true);
  }
  tiles.slice(0, 2).forEach(renderTile);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        renderTile(entry.target);
      });
    }, { rootMargin: "500px 0px", threshold: 0.01 });
    tiles.slice(2).forEach(tile => observer.observe(tile));
  } else tiles.slice(2).forEach(renderTile);

  window.ModelPanstwaVisualEngine = Object.freeze({
    version: VERSION,
    getStatus() {
      return {
        version: state.version, hero: state.hero, tiles: { ...state.tiles },
        errors: state.errors.map(error => ({ ...error })),
        tileCount: tiles.length, recipeCount: Object.keys(RECIPES).length,
        deterministic: true, recipeCore: window.LeonVisualRecipeCore?.version || "missing",\n        assetRoot: ROOT.href,
        rom: ROM.version
      };
    },
    getRecipes() { return Object.keys(RECIPES); },
    retryFailed() {
      tiles.filter(tile => tile.dataset.visualState === "failed").forEach(tile => {
        tile.dataset.visualState = "idle"; renderTile(tile);
      });
      if (hero && state.hero === "error") { state.hero = "loading"; renderImage(hero, ROM.hero, true); }
    }
  });
  window.dispatchEvent(new CustomEvent("model-panstwa:visual-ready", { detail: { version: VERSION } }));
})();