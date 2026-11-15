/* Leon Visual Recipe Core 1.0
   Reusable deterministic image compositor for every page in the project.
   It reproduces a visual result from fixed source assets + fixed recipe data.
   No randomness, remote generation, network API, or personal data. */
(() => {
  "use strict";
  const VERSION = "1.0.0";
  const SAFE_ASSET = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9_./-]+\.(?:svg|webp|png|jpe?g)$/i;

  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
  }

  function fingerprint(value) {
    const input = stableStringify(value);
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function validateRecipe(recipe) {
    if (!recipe || typeof recipe !== "object") throw new TypeError("recipe-required");
    if (typeof recipe.asset !== "string" || !SAFE_ASSET.test(recipe.asset)) throw new TypeError("unsafe-or-invalid-asset");
    const focal = typeof recipe.focal === "string" ? recipe.focal : "50% 50%";
    if (!/^(?:\d{1,3}%|left|center|right)\s+(?:\d{1,3}%|top|center|bottom)$/.test(focal)) {
      throw new TypeError("invalid-focal-point");
    }
    const fit = recipe.fit === "contain" ? "contain" : "cover";
    const shade = Number.isFinite(recipe.shade) ? Math.min(0.85, Math.max(0, recipe.shade)) : 0;
    const accent = typeof recipe.accent === "string" && /^#[0-9a-f]{6}$/i.test(recipe.accent) ? recipe.accent : "#39a9ef";
    return Object.freeze({ asset: recipe.asset, focal, fit, shade, accent, alt: typeof recipe.alt === "string" ? recipe.alt : "" });
  }

  function render(host, input, options) {
    if (!(host instanceof Element)) throw new TypeError("render-target-required");
    const recipe = validateRecipe(input);
    const opts = options || {};
    const base = opts.baseURL instanceof URL ? opts.baseURL : new URL("./", document.currentScript ? document.currentScript.src : location.href);
    const src = new URL(recipe.asset, base);
    if (src.origin !== location.origin) throw new TypeError("cross-origin-asset-blocked");

    const image = document.createElement("img");
    image.className = opts.className || "leon-recipe-image";
    image.alt = recipe.alt;
    image.setAttribute("aria-hidden", recipe.alt ? "false" : "true");
    image.setAttribute("draggable", "false");
    image.decoding = "async";
    image.loading = opts.priority ? "eager" : "lazy";
    if (opts.priority && "fetchPriority" in image) image.fetchPriority = "high";
    image.style.objectPosition = recipe.focal;
    image.style.objectFit = recipe.fit;
    image.dataset.recipeHash = fingerprint(recipe);

    host.prepend(image);
    image.addEventListener("load", () => {
      host.classList.add("visual-image-ready");
      host.classList.remove("visual-image-error");
      if (typeof opts.onLoad === "function") opts.onLoad(image, recipe);
    }, { once: true });
    image.addEventListener("error", () => {
      image.remove();
      host.classList.add("visual-image-error");
      if (typeof opts.onError === "function") opts.onError(src.href, recipe);
    }, { once: true });
    image.src = src.href;
    return Object.freeze({ image, recipe, hash: fingerprint(recipe), src: src.href });
  }

  window.LeonVisualRecipeCore = Object.freeze({
    version: VERSION,
    validateRecipe,
    fingerprint,
    render,
    stableStringify
  });
})();