/* Leon Visual Segmenter 1.0.0
 * Deterministic extraction of a regular image atlas into independent PNG blobs.
 * No network access, dependencies, or source-image mutation.
 */
(function (root) {
  "use strict";

  const LIMITS = Object.freeze({ maxDimension: 16384, maxPixels: 40000000, maxCells: 100 });

  function planSegments(width, height, options) {
    const config = options || {};
    const columns = config.columns === undefined ? 5 : config.columns;
    const rows = config.rows === undefined ? 2 : config.rows;

    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
      throw new TypeError("invalid-source-dimensions");
    }
    if (width > LIMITS.maxDimension || height > LIMITS.maxDimension || width * height > LIMITS.maxPixels) {
      throw new RangeError("source-image-limit-exceeded");
    }
    if (!Number.isSafeInteger(columns) || !Number.isSafeInteger(rows) || columns < 1 || rows < 1 || columns * rows > LIMITS.maxCells) {
      throw new RangeError("invalid-grid-size");
    }
    if (width % columns !== 0 || height % rows !== 0) {
      throw new RangeError("source-does-not-divide-evenly-into-grid");
    }

    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const segments = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        segments.push(Object.freeze({
          index: row * columns + column,
          row,
          column,
          x: column * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight
        }));
      }
    }
    return Object.freeze(segments);
  }

  function canvasFor(width, height) {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
    if (typeof document !== "undefined" && document.createElement) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    throw new Error("canvas-api-unavailable");
  }

  function toBlob(canvas) {
    if (typeof canvas.convertToBlob === "function") return canvas.convertToBlob({ type: "image/png" });
    return new Promise((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("png-encoding-failed")),
      "image/png"
    ));
  }

  async function extract(source, options) {
    if (!source) throw new TypeError("invalid-image-source");
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    const plan = planSegments(width, height, options);
    const results = [];

    for (const segment of plan) {
      const canvas = canvasFor(segment.width, segment.height);
      const context = canvas.getContext("2d", { alpha: true, willReadFrequently: false });
      if (!context) throw new Error("2d-canvas-unavailable");
      context.clearRect(0, 0, segment.width, segment.height);
      context.drawImage(source, segment.x, segment.y, segment.width, segment.height, 0, 0, segment.width, segment.height);
      const blob = await toBlob(canvas);
      if (!blob || blob.type !== "image/png" || blob.size === 0) throw new Error("invalid-extracted-image");
      results.push(Object.freeze({ ...segment, blob }));
      canvas.width = 1;
      canvas.height = 1;
    }
    return Object.freeze(results);
  }

  const api = Object.freeze({ version: "1.0.0", planSegments, extract, limits: LIMITS });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LeonVisualSegmenter = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
