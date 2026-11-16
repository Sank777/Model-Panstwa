/* Leon Visual Runtime 1.0.0
 * Page-scoped, opt-in visual slots. Keeps semantic HTML as the source of truth.
 * No network origins, HTML injection, inline event handlers or automatic animation.
 */
(() => {
  "use strict";
  const VERSION = "1.0.0";
  const INSTANCE = "__LEON_VISUAL_RUNTIME__";
  if (window[INSTANCE]) return;
  const state = { started:false, slots:0, rendered:0, failed:0, pending:0, errors:[] };
  const imageCache = new Map();
  const segmentCache = new Map();
  const objectURLs = new Set();
  let observer = null;

  function safeAsset(path) {
    if (typeof path !== "string" || !/^[a-z0-9_/-]+\.(?:webp|png|jpe?g)$/i.test(path) ||
        path.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error("asset-path-rejected");
    }
    const root = new URL("./", document.currentScript && document.currentScript.src || location.href);
    const url = new URL(path, root);
    if (url.origin !== location.origin || !url.pathname.startsWith(root.pathname)) {
      throw new Error("asset-origin-rejected");
    }
    return url.href;
  }

  function loadImage(path) {
    const url = safeAsset(path);
    if (!imageCache.has(url)) {
      const promise = new Promise((resolve,reject) => {
        const image = new Image();
        image.decoding = "async";
        image.referrerPolicy = "no-referrer";
        image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve(image) : reject(new Error("image-decode-empty"));
        image.onerror = () => reject(new Error("asset-load-failed"));
        image.src = url;
      }).catch(error => { imageCache.delete(url); throw error; });
      imageCache.set(url,promise);
    }
    return imageCache.get(url);
  }

  function parseRegions(raw) {
    const value = JSON.parse(raw);
    if (!Array.isArray(value) || !value.length || value.length > 100) throw new Error("invalid-regions");
    return value;
  }

  function configFor(slot) {
    const mode = slot.dataset.leonVisualMode || "single";
    if (!["single","grid","regions"].includes(mode)) throw new Error("unsupported-mode");
    if (mode === "single") return { mode };
    if (!window.LeonVisualSegmenter) throw new Error("segmenter-unavailable");
    if (mode === "grid") {
      const columns = Number(slot.dataset.leonVisualColumns || 1);
      const rows = Number(slot.dataset.leonVisualRows || 1);
      const padding = Number(slot.dataset.leonVisualPadding || 0);
      const gapX = Number(slot.dataset.leonVisualGapX || 0);
      const gapY = Number(slot.dataset.leonVisualGapY || 0);
      if (![columns,rows,padding,gapX,gapY].every(Number.isSafeInteger)) throw new Error("invalid-grid-config");
      return { mode, columns, rows, padding, gapX, gapY };
    }
    return { mode, regions:parseRegions(slot.dataset.leonVisualRegions || "") };
  }

  async function render(slot) {
    if (slot.dataset.leonVisualState === "loaded" || slot.dataset.leonVisualState === "loading") return;
    const asset = slot.dataset.leonVisualSrc;
    const index = Number(slot.dataset.leonVisualIndex || 0);
    if (!Number.isSafeInteger(index) || index < 0 || index >= 100) throw new Error("invalid-segment-index");
    const config = configFor(slot);
    slot.dataset.leonVisualState = "loading";
    state.pending++;
    try {
      const source = await loadImage(asset);
      let src = source.currentSrc || safeAsset(asset);
      if (config.mode !== "single") {
        const key = asset + "|" + JSON.stringify(config) + "|" + source.naturalWidth + "x" + source.naturalHeight;
        if (!segmentCache.has(key)) {
          const promise = window.LeonVisualSegmenter.extract(source,config).catch(error => { segmentCache.delete(key); throw error; });
          segmentCache.set(key,promise);
        }
        const segments = await segmentCache.get(key);
        const segment = segments[index];
        if (!segment || !segment.blob || !segment.width || !segment.height) throw new Error("segment-validation-failed");
        src = URL.createObjectURL(segment.blob);
        objectURLs.add(src);
      }
      let image = slot.querySelector(":scope > .leon-visual-runtime-image");
      if (!image) {
        image = document.createElement("img");
        image.className = "leon-visual-runtime-image";
        image.alt = "";
        image.setAttribute("aria-hidden","true");
        image.decoding = "async";
        image.draggable = false;
        slot.prepend(image);
      }
      image.src = src;
      if (typeof image.decode === "function") await image.decode();
      slot.dataset.leonVisualState = "loaded";
      state.rendered++;
    } catch (error) {
      slot.dataset.leonVisualState = "fallback";
      state.failed++;
      if (state.errors.length < 30) state.errors.push(String(error && error.message || error));
    } finally {
      state.pending--;
    }
  }

  function schedule(slot) {
    if (slot.dataset.leonVisualState) return;
    if (observer) observer.observe(slot);
    else render(slot).catch(() => {});
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches("[data-leon-visual-src]")) schedule(scope);
    scope.querySelectorAll("[data-leon-visual-src]").forEach(schedule);
  }

  function getStatus() {
    return Object.freeze({ version:VERSION, running:state.started, slots:state.slots,
      rendered:state.rendered, failed:state.failed, pending:state.pending, errors:state.errors.slice() });
  }

  function start() {
    if (state.started) return;
    state.started = true;
    const slots = document.querySelectorAll("[data-leon-visual-src]");
    state.slots = slots.length;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          render(entry.target).catch(() => {});
        });
      },{ rootMargin:"160px 0px", threshold:0.01 });
    }
    window.LeonVisualRuntime = Object.freeze({ version:VERSION, scan, getStatus });
    scan(document);
    if ("MutationObserver" in window) {
      const mutations = new MutationObserver(records => records.forEach(record =>
        record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); })
      ));
      mutations.observe(document.body,{ childList:true, subtree:true });
    }
    window.addEventListener("pagehide",() => {
      if (observer) observer.disconnect();
      objectURLs.forEach(url => URL.revokeObjectURL(url));
      objectURLs.clear();
    },{ once:true });
    console.info("[Leon Visual Runtime]",getStatus());
  }

  window[INSTANCE] = VERSION;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{ once:true });
  else start();
})();
