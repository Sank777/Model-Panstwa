(() => {
  "use strict";

  /* Leon Visual Engine 5.4
     Deterministic recipe renderer: all visual decisions are fixed in this manifest.
     No random values, external image API, runtime image generation or user data. */
  const VERSION = "5.6.0";
  const ROOT = new URL("./menu/", document.currentScript.src);
  const hero = document.querySelector(".hero-banner");
  const tiles = Array.from(document.querySelectorAll(".pillar-tile"));

  /* Recipe = immutable source + focal point + accent + fixed treatment.
     Values are deliberately explicit so the same input always produces the same scene. */
  const ROM = window.LeonVisualROM;
  if (!ROM || ROM.version !== "1.1.0") {
    throw new Error("visual-rom-missing-or-incompatible");
  }
  const RECIPES = ROM.tiles;

  const state = {
    version: VERSION,
    hero: hero ? "waiting" : "missing",
    tiles: { total: tiles.length, loaded: 0, failed: 0, pending: 0 },
    errors: []
  };

  const assetURL = name => new URL(name, ROOT).href;
  function recipeFor(tile) {
    for (const key in RECIPES) {
      if (tile.classList.contains(key)) return RECIPES[key];
    }
    return null;
  }

  function recordError(target, url, reason) {
    state.errors.push({ target, url, reason });
    if (state.errors.length > 20) state.errors.shift();
  }

  function applyImage(host, file, className, priority, target, focal) {
    const core = window.LeonVisualRecipeCore;
    if (!core) {
      recordError(target, file, "recipe-core-missing");
      host.classList.add("visual-image-error");
      return;
    }
    const shade = Number.parseFloat(host.style.getPropertyValue("--tile-shade-opacity")) || 0;
    try {
      core.render(host, {
        asset: file,
        focal: focal || "50% 50%",
        fit: "cover",
        shade,
        accent: host.style.getPropertyValue("--tile-accent").trim() || "#39a9ef"
      }, {
        baseURL: ROOT,
        className,
        priority,
        onLoad() {
          if (priority) state.hero = "loaded";
          else {
            state.tiles.loaded++;
            state.tiles.pending = Math.max(0, state.tiles.pending - 1);
          }
        },
        onError(src) {
          recordError(target, src, "asset-unavailable");
          if (priority) state.hero = "error";
          else {
            state.tiles.failed++;
            state.tiles.pending = Math.max(0, state.tiles.pending - 1);
          }
        }
      });
    } catch (error) {
      recordError(target, file, error && error.message ? error.message : "recipe-invalid");
      host.classList.add("visual-image-error");
      if (priority) state.hero = "error";
      else {
        state.tiles.failed++;
        state.tiles.pending = Math.max(0, state.tiles.pending - 1);
      }
    }
  }

  if (hero) {
    hero.classList.add("visual-engine-active");
    state.hero = "loading";
    applyImage(hero, ROM.hero.asset, "visual-engine-image", true, "hero", ROM.hero.focal);
  }

  function renderTile(tile) {
    if (tile.dataset.visualLoaded === "1") return;
    const recipe = recipeFor(tile);
    if (!recipe) {
      tile.classList.add("visual-image-error");
      recordError("tile-recipe", tile.className, "recipe-not-found");
      return;
    }
    tile.dataset.visualLoaded = "1";
    tile.dataset.visualRecipe = ROM.version;
    tile.style.setProperty("--tile-accent", recipe.accent);
    tile.style.setProperty("--tile-focal", recipe.focal);
    tile.style.setProperty("--tile-shade-opacity", recipe.shade === "strong" ? "0.58" : "0.38");
    state.tiles.pending++;
    applyImage(tile, recipe.asset, "visual-engine-tile-image", false, tile.className, recipe.focal);
  }

  tiles.slice(0, 2).forEach(renderTile);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        renderTile(entry.target);
      });
    }, { rootMargin: "650px 0px", threshold: 0.01 });
    tiles.slice(2).forEach(tile => observer.observe(tile));
  } else {
    tiles.slice(2).forEach(renderTile);
  }

  window.ModelPanstwaVisualEngine = Object.freeze({
    version: VERSION,
    getStatus() {
      return {
        version: state.version,
        hero: state.hero,
        tiles: { ...state.tiles },
        errors: state.errors.map(error => ({ ...error })),
        tileCount: tiles.length,
        recipeCount: Object.keys(RECIPES).length,
        deterministic: true,
        recipeCore: window.LeonVisualRecipeCore ? window.LeonVisualRecipeCore.version : "missing"
      };
    },
    getRecipes() {
      return Object.keys(RECIPES);
    },
    renderRecipe(host, recipe, options) {
      const core = window.LeonVisualRecipeCore;
      if (!core) throw new Error("recipe-core-missing");
      const opts = options || {};
      return core.renderRecipe(host, recipe, { ...opts, baseURL: opts.baseURL || new URL("./", document.currentScript ? document.currentScript.src : location.href) });
    },
    recipeFingerprint(recipe) {
      if (!window.LeonVisualRecipeCore) throw new Error("recipe-core-missing");
      return window.LeonVisualRecipeCore.fingerprint(window.LeonVisualRecipeCore.validateRecipe(recipe));
    }
  });
})();