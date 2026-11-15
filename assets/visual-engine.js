(() => {
  "use strict";

  /* Leon Visual Engine 5.1
     Deterministic recipe renderer: all visual decisions are fixed in this manifest.
     No random values, external image API, runtime image generation or user data. */
  const VERSION = "5.1.0";
  const ROOT = new URL("./menu/", document.currentScript.src);
  const hero = document.querySelector(".hero-banner");
  const tiles = Array.from(document.querySelectorAll(".pillar-tile"));

  /* Recipe = immutable source + focal point + accent + fixed treatment.
     Values are deliberately explicit so the same input always produces the same scene. */
  const RECIPES = Object.freeze({
    "pillar-1":  Object.freeze({ asset:"leon-filar-01-fundament.svg", focal:"50% 50%", accent:"#fa3048", shade:"strong" }),
    "pillar-2":  Object.freeze({ asset:"leon-filar-02-gospodarka.svg", focal:"50% 50%", accent:"#168cff", shade:"medium" }),
    "pillar-3":  Object.freeze({ asset:"leon-filar-03-prawo.svg", focal:"50% 50%", accent:"#f2c94c", shade:"strong" }),
    "pillar-4":  Object.freeze({ asset:"leon-filar-04-bezpieczenstwo.svg", focal:"50% 50%", accent:"#55d88a", shade:"medium" }),
    "pillar-5":  Object.freeze({ asset:"leon-filar-05-emerytury.svg", focal:"50% 50%", accent:"#c66cff", shade:"medium" }),
    "pillar-6":  Object.freeze({ asset:"leon-filar-06-kapital-ludzki.svg", focal:"50% 50%", accent:"#27d4e8", shade:"medium" }),
    "pillar-7":  Object.freeze({ asset:"leon-filar-07-strategia.svg", focal:"50% 50%", accent:"#278cff", shade:"medium" }),
    "pillar-8":  Object.freeze({ asset:"leon-filar-08-informacje.svg", focal:"50% 50%", accent:"#ed49b6", shade:"strong" }),
    "pillar-9":  Object.freeze({ asset:"leon-filar-09-demografia.svg", focal:"50% 50%", accent:"#f08a43", shade:"medium" }),
    "pillar-10": Object.freeze({ asset:"leon-filar-10-finanse.svg", focal:"50% 50%", accent:"#20cda8", shade:"medium" })
  });

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
    const src = assetURL(file);
    const image = document.createElement("img");
    image.className = className;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.setAttribute("draggable", "false");
    image.decoding = "async";
    image.loading = priority ? "eager" : "lazy";
    if (focal) image.style.objectPosition = focal;
    if (priority && "fetchPriority" in image) image.fetchPriority = "high";

    image.addEventListener("load", () => {
      host.classList.add("visual-image-ready");
      host.classList.remove("visual-image-error");
      if (priority) state.hero = "loaded";
      else {
        state.tiles.loaded++;
        state.tiles.pending = Math.max(0, state.tiles.pending - 1);
      }
    }, { once: true });

    image.addEventListener("error", () => {
      image.remove();
      host.classList.add("visual-image-error");
      recordError(target, src, "asset-unavailable");
      if (priority) state.hero = "error";
      else {
        state.tiles.failed++;
        state.tiles.pending = Math.max(0, state.tiles.pending - 1);
      }
    }, { once: true });

    host.prepend(image);
    image.src = src;
  }

  if (hero) {
    hero.classList.add("visual-engine-active");
    state.hero = "loading";
    applyImage(hero, "polska-hero.webp", "visual-engine-image", true, "hero", "center 54%");
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
    tile.dataset.visualRecipe = "5.1";
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
        deterministic: true
      };
    },
    getRecipes() {
      return Object.keys(RECIPES);
    }
  });
})();