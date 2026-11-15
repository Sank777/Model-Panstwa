const JPEG_METADATA_MARKERS = new Set([0xe1, 0xed, 0xfe]);
const PNG_METADATA_CHUNKS = new Set(["eXIf", "tEXt", "iTXt", "zTXt", "tIME"]);
const WEBP_METADATA_CHUNKS = new Set(["EXIF", "XMP "]);

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function concat(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

function stripJpeg(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Invalid JPEG");
  const parts = [bytes.subarray(0, 2)];
  let offset = 2;
  let reachedScan = false;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("Malformed JPEG marker");
    const markerStart = offset;
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) throw new Error("Truncated JPEG marker");
    const marker = bytes[offset++];
    if (marker === 0xda) {
      if (offset + 2 > bytes.length) throw new Error("Truncated JPEG scan");
      const length = (bytes[offset] << 8) | bytes[offset + 1];
      if (length < 2 || offset + length > bytes.length) throw new Error("Invalid JPEG scan");
      parts.push(bytes.subarray(markerStart));
      reachedScan = true;
      break;
    }
    if (marker === 0xd9 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      parts.push(bytes.subarray(markerStart, offset));
      if (marker === 0xd9) break;
      continue;
    }
    if (offset + 2 > bytes.length) throw new Error("Truncated JPEG segment");
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) throw new Error("Invalid JPEG segment");
    const end = offset + length;
    if (!JPEG_METADATA_MARKERS.has(marker)) parts.push(bytes.subarray(markerStart, end));
    offset = end;
  }
  if (!reachedScan) throw new Error("JPEG has no image scan");
  return concat(parts);
}

function stripPng(bytes: Uint8Array): Uint8Array {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 20 || signature.some((v, i) => bytes[i] !== v)) throw new Error("Invalid PNG");
  const parts = [bytes.subarray(0, 8)];
  let offset = 8;
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("Truncated PNG chunk");
    const type = ascii(bytes, offset + 4, 4);
    if (!PNG_METADATA_CHUNKS.has(type)) parts.push(bytes.subarray(offset, end));
    offset = end;
    if (type === "IEND") { ended = true; break; }
  }
  if (!ended || offset !== bytes.length) throw new Error("Malformed PNG structure");
  return concat(parts);
}

function stripWebp(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 12 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    throw new Error("Invalid WebP");
  }
  const declared = new DataView(bytes.buffer, bytes.byteOffset + 4, 4).getUint32(0, true);
  if (declared + 8 !== bytes.length) throw new Error("Invalid WebP RIFF length");
  const chunks: Uint8Array[] = [];
  let offset = 12;
  let sawImage = false;
  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4);
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true);
    const padded = length + (length & 1);
    const end = offset + 8 + padded;
    if (end > bytes.length) throw new Error("Truncated WebP chunk");
    if (!WEBP_METADATA_CHUNKS.has(type)) {
      const chunk = bytes.slice(offset, end);
      if (type === "VP8X") {
        if (length < 10) throw new Error("Invalid WebP VP8X chunk");
        chunk[8] &= ~(0x08 | 0x04);
      }
      chunks.push(chunk);
    }
    if (type === "VP8 " || type === "VP8L" || type === "ANMF") sawImage = true;
    offset = end;
  }
  if (offset !== bytes.length || !sawImage) throw new Error("Malformed WebP structure");
  const body = concat(chunks);
  const header = new Uint8Array(12);
  header.set([82, 73, 70, 70]);
  new DataView(header.buffer).setUint32(4, body.length + 4, true);
  header.set([87, 69, 66, 80], 8);
  return concat([header, body]);
}

export function stripImageMetadata(bytes: Uint8Array, mime: string): Uint8Array {
  if (mime === "image/jpeg") return stripJpeg(bytes);
  if (mime === "image/png") return stripPng(bytes);
  if (mime === "image/webp") return stripWebp(bytes);
  throw new Error("Unsupported image type");
}
