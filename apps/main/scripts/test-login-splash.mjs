import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { AsyncLocalStorage } from "node:async_hooks";

const require = createRequire(import.meta.url);
// Next normally installs this in its server bootstrap, absent in plain Node tests.
globalThis.AsyncLocalStorage ??= AsyncLocalStorage;
const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server");
const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const compiled = ts.transpileModule(source("src/lib/app-splash.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports });
let assertions = 0;
const eq = (actual, expected) => { assert.equal(actual, expected); assertions++; };

function boot({ path = "/login", search = "", reduced = false, stored = null, blocked = false } = {}) {
  const document = { documentElement: { dataset: {} } };
  const context = {
    document,
    location: { pathname: path, search },
    URLSearchParams,
    matchMedia: () => ({ matches: reduced }),
    sessionStorage: {
      getItem: () => { if (blocked) throw Error("Storage unavailable"); return stored; },
      setItem: (_key, value) => { stored = value; },
    },
  };
  const run = () => vm.runInNewContext(exports.SPLASH_BOOTSTRAP, context);
  run();
  return { document, run, stored: () => stored };
}

const first = boot();
eq(first.document.documentElement.dataset.appSplash, "show");
eq(first.stored(), "seen");
delete first.document.documentElement.dataset.appSplash;
first.run();
eq(first.document.documentElement.dataset.appSplash, undefined);
eq(boot({ stored: "seen" }).document.documentElement.dataset.appSplash, undefined);
eq(boot({ stored: "seen", search: "?splash=1" }).document.documentElement.dataset.appSplash, "show");
eq(boot({ reduced: true }).document.documentElement.dataset.appSplash, undefined);
eq(boot({ reduced: true, search: "?splash=1" }).document.documentElement.dataset.appSplash, undefined);
eq(boot({ path: "/admin" }).document.documentElement.dataset.appSplash, undefined);
eq(boot({ path: "/admin/members", search: "?splash=1" }).document.documentElement.dataset.appSplash, undefined);
eq(boot({ blocked: true }).document.documentElement.dataset.appSplash, undefined);
eq(boot({ path: "/home" }).document.documentElement.dataset.appSplash, "show");
eq(boot({ stored: "seen", search: "?splash=0" }).document.documentElement.dataset.appSplash, undefined);

// Parse only the config AST: this test never imports or executes auth logic.
const middleware = ts.createSourceFile("middleware.ts", source("src/middleware.ts"), ts.ScriptTarget.Latest, true);
let matcher;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(middleware) === "config") {
    matcher = node.initializer.properties.find((p) => p.name.getText(middleware) === "matcher")
      .initializer.elements.map((item) => item.text);
  }
  ts.forEachChild(node, visit);
}
visit(middleware);
assert.ok(matcher);
for (const [url, expected] of [
  ["/media/login-ocean.mp4", false],
  ["/media/login-ocean.mp4?v=1", false],
  ["/media/login-ocean-poster.jpg", false],
  ["/media/another.mp4", true],
  ["/media/login-ocean.mp4/private", true],
  ["/home", true],
  ["/admin", true],
  ["/api/admin/members/123", true],
  ["/api/weather", true],
]) {
  eq(unstable_doesMiddlewareMatch({ config: { matcher }, nextConfig: {}, url }), expected);
}
eq(source("src/app/LoginScreen.tsx").includes("dolphin-hero"), false);
eq(source("src/components/login/LoginFilm.tsx").includes('preload="none"'), true);
eq(source("src/components/onboarding/AppSplash.module.css").includes("prefers-reduced-motion"), true);
console.log(`PASS: ${assertions} login/splash assertions (no network or account writes).`);
