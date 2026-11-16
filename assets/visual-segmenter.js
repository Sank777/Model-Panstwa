/* Leon Visual Segmenter 2.0.0
 * Universal local image analysis and deterministic region extraction.
 * Supports single, grid (including remainder pixels), regions and conservative auto mode.
 */
(function (root) {
  "use strict";
  const LIMITS = Object.freeze({ maxDimension: 16384, maxPixels: 40000000, maxCells: 100, maxOutputBytes: 32000000 });
  const integer = Number.isSafeInteger;

  function dimensions(source) {
    const width = source && (source.naturalWidth || source.videoWidth || source.width);
    const height = source && (source.naturalHeight || source.videoHeight || source.height);
    if (!integer(width) || !integer(height) || width <= 0 || height <= 0) throw new TypeError("invalid-source-dimensions");
    if (width > LIMITS.maxDimension || height > LIMITS.maxDimension || width * height > LIMITS.maxPixels) throw new RangeError("source-image-limit-exceeded");
    return Object.freeze({ width, height, aspectRatio: width / height });
  }
  function analyze(source) {
    const size = dimensions(source);
    return Object.freeze({ ...size, format: source.currentSrc ? (source.currentSrc.split(".").pop().split(/[?#]/)[0].toLowerCase()) : "decoded-image", complete: source.complete !== false });
  }
  function validateRect(rect, bounds) {
    if (!rect || !["x","y","width","height"].every(key => integer(rect[key]))) throw new TypeError("invalid-region-rectangle");
    const { x,y,width,height } = rect;
    if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > bounds.width || y + height > bounds.height) throw new RangeError("region-out-of-bounds");
    return Object.freeze({ x,y,width,height });
  }
  function planGrid(width, height, options) {
    const size = dimensions({ width, height });
    const columns = options && options.columns !== undefined ? options.columns : 5;
    const rows = options && options.rows !== undefined ? options.rows : 2;
    if (!integer(columns) || !integer(rows) || columns < 1 || rows < 1 || columns * rows > LIMITS.maxCells || columns > width || rows > height) throw new RangeError("invalid-grid-size");
    const result = [];
    for (let row=0; row<rows; row++) for (let column=0; column<columns; column++) {
      const x0 = Math.floor(column * width / columns), x1 = Math.floor((column + 1) * width / columns);
      const y0 = Math.floor(row * height / rows), y1 = Math.floor((row + 1) * height / rows);
      result.push(Object.freeze({ index: row * columns + column, row, column, x:x0, y:y0, width:x1-x0, height:y1-y0 }));
    }
    return Object.freeze(result);
  }
  function planRegions(width, height, regions) {
    const bounds = dimensions({ width, height });
    if (!Array.isArray(regions) || !regions.length || regions.length > LIMITS.maxCells) throw new RangeError("invalid-region-list");
    return Object.freeze(regions.map((region,index) => Object.freeze({ index, ...validateRect(region,bounds) })));
  }
  function planSegments(width,height,options) { return planGrid(width,height,options); }
  function canvasFor(width,height) {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width,height);
    if (typeof document !== "undefined" && document.createElement) { const canvas=document.createElement("canvas"); canvas.width=width; canvas.height=height; return canvas; }
    throw new Error("canvas-api-unavailable");
  }
  function toBlob(canvas) {
    if (typeof canvas.convertToBlob === "function") return canvas.convertToBlob({type:"image/png"});
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("png-encoding-failed")),"image/png"));
  }
  async function extractPlan(source,plan) {
    const output=[];
    for (const rect of plan) {
      const canvas=canvasFor(rect.width,rect.height);
      try {
        const context=canvas.getContext("2d",{alpha:true,willReadFrequently:false});
        if (!context) throw new Error("2d-canvas-unavailable");
        context.drawImage(source,rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);
        const blob=await toBlob(canvas);
        if (!blob || blob.type!=="image/png" || !blob.size || blob.size>LIMITS.maxOutputBytes) throw new Error("invalid-extracted-image");
        output.push(Object.freeze({...rect,blob}));
      } finally { canvas.width=1; canvas.height=1; }
    }
    return Object.freeze(output);
  }
  async function extract(source,options) {
    if (!source) throw new TypeError("invalid-image-source");
    const size=dimensions(source), config=options||{}, mode=config.mode||"grid";
    let plan;
    if (mode==="single") return Object.freeze([]);
    if (mode==="grid") plan=planGrid(size.width,size.height,config);
    else if (mode==="regions") plan=planRegions(size.width,size.height,config.regions);
    else if (mode==="auto") {
      if (config.regions) plan=planRegions(size.width,size.height,config.regions);
      else if (config.grid) plan=planGrid(size.width,size.height,config.grid);
      else return Object.freeze([]);
    } else throw new TypeError("unsupported-segmentation-mode");
    return extractPlan(source,plan);
  }
  const api=Object.freeze({version:"2.0.0",analyze,dimensions,planSegments,planGrid,planRegions,extract,limits:LIMITS});
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.LeonVisualSegmenter=api;
})(typeof globalThis!=="undefined"?globalThis:this);
