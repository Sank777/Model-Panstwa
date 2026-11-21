import { readFile } from "node:fs/promises";
import { strict as assert } from "node:assert";

const path = new URL("../assets/cases/index.json", import.meta.url);
const data = JSON.parse(await readFile(path, "utf8"));
const evidence = new Set(["do_weryfikacji","zebrano_linki","dokumenty_pobrane","dane_zweryfikowane","karta_opracowana","wymaga_aktualizacji","nie_dotyczy"]);
assert.equal(data.schemaVersion, "1.0.0");
assert.ok(Array.isArray(data.cases) && data.cases.length >= 8, "Expected at least eight existing case records");
assert.equal(data.nikTopics.length, 12, "Expected eleven NIK topics plus the PSP/OSP topic");
const ids = new Set();
for (const item of [...data.cases, ...(data.educationalScenarios || [])]) {
  assert.ok(item.id && item.title && item.category && item.status, "Case metadata is incomplete");
  assert.ok(!ids.has(item.id), "Duplicate case id: " + item.id);
  ids.add(item.id);
  assert.ok(evidence.has(item.evidenceStatus), "Unknown evidence status for " + item.id);
  for (const source of item.sources || []) {
    assert.ok(/^https:\/\//i.test(source.url), "Only HTTPS source links are allowed: " + source.url);
    assert.ok(source.label && source.type, "Source label/type missing for " + item.id);
  }
  assert.ok(Array.isArray(item.sections), "Sections must be an array for " + item.id);
}
let topicsWithSources = 0;
for (const topic of data.nikTopics) {
  assert.ok(topic.id && topic.title && evidence.has(topic.evidenceStatus), "Invalid NIK topic");
  if (topic.sources?.length) topicsWithSources++;
  if (topic.id !== "NIK-TOPIC-12") {
    assert.equal(topic.analysisBlocks?.length, 3, "Expected three analytical blocks for " + topic.id);
    assert.deepEqual(topic.analysisBlocks.map(block => block.id), ["nik-description","connections-tested","system-lesson"], "Unexpected analytical block order for " + topic.id);
    for (const block of topic.analysisBlocks) {
      assert.ok(block.title && block.lead && Array.isArray(block.points) && block.points.length >= 3, "Incomplete analytical block for " + topic.id);
      assert.ok(block.points.every(point => typeof point === "string" && point.trim().length > 20), "Analytical point is too short for " + topic.id);
    }
    assert.ok(topic.imagePlan?.scene && topic.imagePlan?.caption && topic.imagePlan?.status === "svg_dodany", "Missing illustration asset for " + topic.id);
    assert.ok(/^assets\/cases\/illustrations\/[a-z0-9-]+\.svg$/.test(topic.imagePlan.src || ""), "Invalid local illustration path for " + topic.id);
    const svg = await readFile(new URL("../" + topic.imagePlan.src, import.meta.url), "utf8");
    assert.ok(svg.startsWith("<svg ") && !/<script|<foreignObject|(?:href|xlink:href)\s*=\s*["']https?:/i.test(svg), "Unsafe or invalid SVG for " + topic.id);
  }
  for (const source of topic.sources || []) {
    assert.ok(/^https:\/\//i.test(source.url), "Only HTTPS topic sources are allowed: " + source.url);
    assert.ok(source.label && source.type, "Topic source label/type missing for " + topic.id);
  }
}
assert.equal(topicsWithSources, 11, "Expected source leads for the eleven citizen/NIK topics; PSP remains separately marked for research");
assert.equal(data.imageDelivery.preferredFormat, "webp");
assert.ok(data.imageDelivery.localOnly === true, "Case images must be local assets");
console.log("Case registry valid:", ids.size, "case/scenario records,", data.nikTopics.length, "topics.");
