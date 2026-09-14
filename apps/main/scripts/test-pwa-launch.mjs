import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const compiled = ts.transpileModule(read("src/lib/app-splash.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
let checks = 0;
const eq = (a, b) => {
  assert.equal(a, b);
  checks++;
};
const ok = (value, message) => {
  assert.ok(value, message);
  checks++;
};

function harness({
  loaded = true,
  hidden = false,
  reduced = false,
  storageBlocked = false,
  expired = false,
} = {}) {
  let now = 0,
    id = 0,
    seen = null;
  const timers = new Map();
  const target = () => {
    const listeners = new Map();
    return {
      listeners,
      addEventListener: (name, callback) => {
        const set = listeners.get(name) ?? new Set();
        set.add(callback);
        listeners.set(name, set);
      },
      removeEventListener: (name, callback) =>
        listeners.get(name)?.delete(callback),
      emit: (name, event = {}) => {
        for (const cb of [...(listeners.get(name) ?? [])]) cb(event);
      },
    };
  };
  const image = { ...target(), complete: loaded };
  const motion = { ...target(), matches: reduced };
  const document = {
    ...target(),
    visibilityState: hidden ? "hidden" : "visible",
    documentElement: { dataset: { appSplash: "show" } },
    querySelector: () => image,
  };
  const setTimeout = (fn, ms) => {
    timers.set(++id, { at: now + ms, fn });
    return id;
  };
  const clearTimeout = (id) => timers.delete(id);
  const window = {
    ...target(),
    setTimeout,
    clearTimeout,
    matchMedia: () => motion,
    getComputedStyle: () => ({ visibility: expired ? "hidden" : "visible" }),
  };
  const api = {};
  vm.runInNewContext(compiled, {
    exports: api,
    document,
    window,
    sessionStorage: {
      setItem: (_, value) => {
        if (storageBlocked) throw Error("blocked");
        seen = value;
      },
    },
    requestAnimationFrame: (fn) => setTimeout(fn, 16),
    cancelAnimationFrame: clearTimeout,
  });
  const cleanup = api.mountSplash();
  return {
    api,
    document,
    image,
    motion,
    window,
    timers,
    cleanup,
    phase: () => document.documentElement.dataset.appSplash,
    seen: () => seen,
    tick(ms) {
      const until = now + ms;
      while (true) {
        const next = [...timers.entries()]
          .filter(([, t]) => t.at <= until)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        timers.delete(next[0]);
        now = next[1].at;
        next[1].fn();
      }
      now = until;
    },
    visibility(value) {
      document.visibilityState = value;
      document.emit("visibilitychange");
    },
  };
}

const first = harness();
eq(first.phase(), "show");
first.tick(32);
eq(first.phase(), "ready");
eq(first.seen(), null);
first.document.emit("focusin");
first.tick(1100);
eq(first.phase(), "ready");
first.tick(100);
eq(first.phase(), "leaving");
first.tick(220);
eq(first.phase(), undefined);
eq(first.seen(), "seen");
eq(first.timers.size, 0);
first.cleanup();
for (const target of [first.document, first.image, first.motion, first.window])
  eq(
    [...target.listeners.values()].reduce((n, s) => n + s.size, 0),
    0,
  );

const slow = harness({ loaded: false });
slow.tick(1000);
eq(slow.phase(), "show");
slow.image.emit("load");
slow.tick(32);
eq(slow.phase(), "ready");
slow.tick(1199);
eq(slow.phase(), "ready");
slow.tick(1);
eq(slow.phase(), "leaving");
slow.tick(220);
eq(slow.phase(), undefined);
const missing = harness({ loaded: false });
missing.tick(100);
missing.image.emit("error");
missing.tick(1452);
eq(missing.phase(), undefined);
const stalled = harness({ loaded: false });
stalled.tick(1800 + 32);
eq(stalled.phase(), "ready");
stalled.tick(1420);
eq(stalled.phase(), undefined);
const background = harness({ hidden: true });
background.tick(10000);
eq(background.phase(), "show");
eq(background.timers.size, 0);
background.visibility("visible");
background.tick(32);
eq(background.phase(), "ready");
background.tick(600);
background.visibility("hidden");
background.tick(10000);
eq(background.phase(), "ready");
background.visibility("visible");
background.tick(32 + 1199);
eq(background.phase(), "ready");
background.tick(221);
eq(background.phase(), undefined);
const reduced = harness({ reduced: true });
eq(reduced.phase(), undefined);
const changedMotion = harness();
changedMotion.motion.matches = true;
changedMotion.motion.emit("change");
eq(changedMotion.phase(), undefined);
const keyboard = harness();
keyboard.document.emit("keydown");
eq(keyboard.phase(), undefined);
const touch = harness({ storageBlocked: true });
touch.document.emit("pointerdown");
eq(touch.phase(), undefined);
const cached = harness();
cached.window.emit("pageshow", { persisted: true });
eq(cached.phase(), undefined);
const exit = harness();
exit.window.emit("pagehide");
eq(exit.phase(), undefined);
const strict = harness();
strict.cleanup();
strict.tick(10000);
eq(strict.phase(), "show");
eq(strict.timers.size, 0);
const fadeBackground = harness();
fadeBackground.tick(1232);
eq(fadeBackground.phase(), "leaving");
fadeBackground.visibility("hidden");
eq(fadeBackground.phase(), undefined);
const lateHydration = harness({ expired: true });
eq(lateHydration.phase(), undefined);

const layout = read("src/app/layout.tsx");
ok(
  layout.indexOf("<AppSplash />") < layout.indexOf("{children}"),
  "Splash must stream before protected/data-dependent children",
);
ok(
  layout.includes("<Suspense fallback=") ||
    /<Suspense\s+fallback=/.test(layout),
);
ok(layout.includes("SPLASH_CRITICAL_CSS"));
ok(
  layout.includes('rel="preload" as="image" href="/brand/dolphin-hello.webp"'),
);
ok(layout.includes("startupImage: APPLE_STARTUP_IMAGES"));
ok(layout.includes('"apple-mobile-web-app-capable": "yes"'));
ok(first.api.SPLASH_CRITICAL_CSS.includes("app-splash-safety 7s"));
ok(first.api.SPLASH_CRITICAL_CSS.includes("animation-play-state:paused"));
ok(
  !first.api.SPLASH_CRITICAL_CSS.match(
    /@keyframes app-splash-ready-safety\{to\{([^}]+)\}/,
  )[1].includes("opacity"),
  "Safety animation must not override the opacity fade",
);
ok(!read("src/components/onboarding/AppSplash.module.css").includes("850ms"));
ok(read("src/components/onboarding/AppSplash.tsx").includes("unoptimized"));
ok(read("src/components/onboarding/AppSplash.tsx").includes('loading="eager"'));
ok(read("src/app/manifest.ts").includes('background_color: "#f8fbff"'));
// Do not introduce a cache of authenticated pages as a workaround for startup.
ok(!read("src/lib/service-worker.js").includes("caches.open"));

const startup = {};
vm.runInNewContext(
  ts.transpileModule(read("src/lib/startup-images.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: startup },
);
eq(startup.APPLE_STARTUP_IMAGES.length, startup.STARTUP_SCREENS.length * 4);
eq(
  new Set(startup.APPLE_STARTUP_IMAGES.map((i) => i.media)).size,
  startup.APPLE_STARTUP_IMAGES.length,
);
for (const item of startup.APPLE_STARTUP_IMAGES) {
  const path = new URL(`public${item.url}`, root);
  const buffer = readFileSync(path);
  eq(buffer.subarray(1, 4).toString(), "PNG");
  eq(buffer.readUInt32BE(16), item.width);
  eq(buffer.readUInt32BE(20), item.height);
  ok(statSync(path).size < 500_000, `${item.url} too large`);
}
console.log(
  `PASS: ${checks} PWA launch checks (timers, visibility, focus, failures, metadata and PNG assets; no device/DB writes).`,
);
