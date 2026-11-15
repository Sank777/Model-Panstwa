import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { stripImageMetadata } from "./image_sanitize.ts";

Deno.test("JPEG strips EXIF/XMP and comment segments without altering scan bytes", () => {
  const input = new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe1, 0x00, 0x06, 0x45, 0x58, 0x49, 0x46,
    0xff, 0xfe, 0x00, 0x04, 0x41, 0x42,
    0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9,
  ]);
  const output = stripImageMetadata(input, "image/jpeg");
  assertEquals(Array.from(output), [0xff,0xd8,0xff,0xda,0x00,0x02,0x11,0x22,0xff,0xd9]);
});

Deno.test("PNG removes metadata chunks and preserves image chunks", () => {
  const chunk = (type: string, data: number[]) => {
    const out = new Uint8Array(12 + data.length);
    new DataView(out.buffer).setUint32(0, data.length);
    out.set([...type].map(c => c.charCodeAt(0)), 4);
    out.set(data, 8);
    return out;
  };
  const sig = new Uint8Array([137,80,78,71,13,10,26,10]);
  const input = new Uint8Array([...sig, ...chunk("IHDR", Array(13).fill(0)), ...chunk("eXIf", [1,2,3]), ...chunk("IDAT", [4,5]), ...chunk("IEND", [])]);
  const output = stripImageMetadata(input, "image/png");
  const text = new TextDecoder("latin1").decode(output);
  assertEquals(text.includes("eXIf"), false);
  assertEquals(text.includes("IHDR"), true);
  assertEquals(text.includes("IDAT"), true);
  assertEquals(text.includes("IEND"), true);
});

Deno.test("WebP removes EXIF/XMP chunks and recalculates RIFF length", () => {
  const chunk = (type: string, data: number[]) => {
    const out = new Uint8Array(8 + data.length + (data.length & 1));
    out.set([...type].map(c => c.charCodeAt(0)));
    new DataView(out.buffer).setUint32(4, data.length, true);
    out.set(data, 8);
    return out;
  };
  const body = new Uint8Array([...chunk("VP8 ", [1,2,3]), ...chunk("EXIF", [9,8])]);
  const input = new Uint8Array(12 + body.length);
  input.set([82,73,70,70]);
  new DataView(input.buffer).setUint32(4, body.length + 4, true);
  input.set([87,69,66,80], 8);
  input.set(body, 12);
  const output = stripImageMetadata(input, "image/webp");
  assertEquals(new TextDecoder().decode(output).includes("EXIF"), false);
  assertEquals(new DataView(output.buffer).getUint32(4, true), output.length - 8);
});

Deno.test("malformed and unsupported images are rejected", () => {
  let failed = false;
  try { stripImageMetadata(new Uint8Array([1,2,3]), "image/jpeg"); } catch { failed = true; }
  assertEquals(failed, true);
  failed = false;
  try { stripImageMetadata(new Uint8Array([1]), "image/gif"); } catch { failed = true; }
  assertEquals(failed, true);
});
