"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const site = fs.readFileSync(path.join(root, "assets/site.js"), "utf8");
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith(".html"));

test("header login remains a single toggleable dialog with accessible state", () => {
  assert.match(site, /function installHeaderLogin\(\)/);
  assert.match(site, /getElementById\("leonHeaderLogin"\)/);
  assert.match(site, /trigger\.setAttribute\("aria-haspopup",\s*"dialog"\)/);
  assert.match(site, /trigger\.setAttribute\("aria-expanded",\s*"false"\)/);
  assert.match(site, /const opening = panel\.hidden/);
  assert.match(site, /panel\.hidden = !opening/);
  assert.match(site, /trigger\.setAttribute\("aria-expanded", String\(opening\)\)/);
});

test("login dialog closes on Escape and outside click, and returns focus on Escape", () => {
  assert.match(site, /event\.key === "Escape"/);
  assert.match(site, /panel\.hidden = true; trigger\.setAttribute\("aria-expanded", "false"\); trigger\.focus\(\)/);
  assert.match(site, /!panel\.contains\(event\.target\) && !trigger\.contains\(event\.target\)/);
});

test("login form keeps semantic fields, accessible status and shared admin destination", () => {
  assert.match(site, /email\.type = "email"/);
  assert.match(site, /password\.type = "password"/);
  assert.match(site, /email\.autocomplete = "username"/);
  assert.match(site, /password\.autocomplete = "current-password"/);
  assert.match(site, /status\.setAttribute\("aria-live", "polite"\)/);
  assert.match(site, /adminLink\.href = "admin\.html"/);
});

test("login dialog has a mobile single-column layout and is not duplicated in page markup", () => {
  assert.match(site, /@media\(max-width:650px\)\{\.leon-header-login\{left:10px;right:10px\}\.leon-header-login form\{grid-template-columns:1fr\}/);
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(html, /id=["']leonHeaderLogin["']/);
  }
});

test("the shared header script is loaded once per themed page where the header login is present", () => {
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    if (html.includes('aria-label="Panel użytkownika"')) {
      assert.match(html, /assets\/site\.js\?v=/, file + ": missing shared header script");
    }
  }
});
