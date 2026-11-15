(() => {
  "use strict";

  /* Leon Visual Engine v4.2 — lokalne sceny SVG, lazy loading i bezpieczny fallback. */
  const ROOT = new URL("./menu/", document.currentScript.src).href;
  const doc = document;
  const hero = doc.querySelector(".hero-banner");
  const tiles = [...doc.querySelectorAll(".pillar-tile")];

  const images = {
    "pillar-1": "leon-filar-01-fundament.svg",
    "pillar-2": "leon-filar-02-gospodarka.svg",
    "pillar-3": "leon-filar-03-prawo.svg",
    "pillar-4": "leon-filar-04-bezpieczenstwo.svg",
    "pillar-5": "leon-filar-05-emerytury.svg",
    "pillar-6": "leon-filar-06-kapital-ludzki.svg",
    "pillar-7": "leon-filar-07-strategia.svg",
    "pillar-8": "leon-filar-08-informacje.svg",
    "pillar-9": "leon-filar-09-demografia.svg",
    "pillar-10": "leon-filar-10-finanse.svg"
  };

  const status = {
    version: "4.2.0",
    hero: "waiting",
    tiles: { total: tiles.length, loaded: 0, failed: 0, pending: 0 },
    errors: []
  };

  const url = name => ROOT + name;
  const error = (where, src) => {
    status.errors.push({ where, src });
    if (status.errors.length > 20) status.errors.shift();
  };

  function mountImage(host, filename, className, priority) {
    const src = url(filename);
    const img = doc.createElement("img");
    img.className = className;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.decoding = "async";
    img.loading = priority ? "eager" : "lazy";
    if (priority) img.fetchPriority = "high";

    img.addEventListener("load", () => {
      host.classList.add("visual-image-ready");
      if (priority) status.hero = "loaded";
      else {
        status.tiles.loaded++;
        status.tiles.pending = Math.max(0, status.tiles.pending - 1);
      }
    }, { once: true });

    img.addEventListener("error", () => {
      img.remove();
      host.classList.add("visual-image-error");
      error(priority ? "hero" : host.className, src);
      if (priority) status.hero = "error";
      else {
        status.tiles.failed++;
        status.tiles.pending = Math.max(0, status.tiles.pending - 1);
      }
    }, { once: true });

    host.prepend(img);
    img.src = src;
  }

  if (hero) {
    hero.classList.add("visual-engine-active");
    status.hero = "loading";
    /* CSS background jest natychmiastowym fallbackiem także bez JavaScriptu. */
    hero.style.setProperty("background-image", 'url("' + url("polska-hero.webp") + '")', "important");
    mountImage(hero, "polska-hero.webp", "visual-engine-image", true);
  } else {
    status.hero = "missing-container";
    error("hero-container", "Nie znaleziono .hero-banner");
  }

  function loadTile(tile) {
    if (tile.dataset.visualLoaded === "1") return;
    const key = Object.keys(images).find(name => tile.classList.contains(name));
    if (!key) {
      error("tile-mapping", tile.className);
      return;
    }
    tile.dataset.visualLoaded = "1";
    status.tiles.pending++;
    tile.style.setProperty("background-image", 'url("' + url(images[key]) + '")', "important");
    mountImage(tile, images[key], "visual-engine-tile-image", false);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          loadTile(entry.target);
        }
      });
    }, { rootMargin: "500px 0px" });
    tiles.forEach(tile => observer.observe(tile));
  } else {
    tiles.forEach(loadTile);
  }

  window.ModelPanstwaVisualEngine = Object.freeze({
    version: status.version,
    getStatus: () => ({
      version: status.version,
      hero: status.hero,
      tiles: { ...status.tiles },
      errors: status.errors.slice(),
      tileCount: tiles.length
    })
  });
})();