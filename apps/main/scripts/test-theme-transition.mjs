import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
let assertions = 0;
const eq = (actual, expected) => { assert.equal(actual, expected); assertions++; };
const transitions = [], commits = [], storage = new Map();
let reduced = false, storageBlocked = false, notices = 0;
const document = { hidden: false, documentElement: { dataset: { theme: 'light' }, style: {} }, querySelector: () => null };
const nativeStart = (callback) => {
  const ready = deferred(), finished = deferred();
  const transition = {
    ready: ready.promise, finished: finished.promise, skipped: false,
    skipTransition() { this.skipped = true; ready.reject(Error('skipped')); },
  };
  const record = { callback, ready, finished, transition };
  transitions.push(record);
  return transition;
};
document.startViewTransition = nativeStart;
const exports = {};
const matchMedia = (query) => ({ matches: query.includes('reduced-motion') && reduced });
vm.runInNewContext(compile(read('src/lib/theme-transition.ts')), { exports, document, matchMedia });
const { transitionTheme, cancelThemeTransition } = exports;
const active = () => document.documentElement.dataset.themeTransition;
const last = () => transitions.at(-1);

transitionTheme(() => commits.push('dark'));
eq(active(), 'active');
eq(commits.length, 0);
last().callback();
last().ready.resolve();
eq(commits.join(), 'dark');
last().finished.resolve();
await Promise.resolve();
eq(active(), undefined);

transitionTheme(() => commits.push('obsolete'));
const obsolete = last();
transitionTheme(() => commits.push('latest'));
eq(obsolete.transition.skipped, true);
obsolete.callback(); // The native API still runs skipped callbacks.
eq(commits.includes('obsolete'), false);
obsolete.finished.resolve();
await Promise.resolve();
eq(active(), 'active'); // Old cleanup must not clear the newer animation.
last().callback();
last().ready.resolve();
last().finished.resolve();
await Promise.resolve();
eq(commits.at(-1), 'latest');
eq(active(), undefined);

transitionTheme(() => commits.push('cancelled'));
const cancelled = last();
cancelThemeTransition();
cancelled.callback();
cancelled.finished.resolve();
await Promise.resolve();
eq(cancelled.transition.skipped, true);
eq(commits.includes('cancelled'), false);
eq(active(), undefined);

for (const mode of ['unsupported', 'reduced', 'hidden']) {
  document.startViewTransition = mode === 'unsupported' ? undefined : nativeStart;
  document.hidden = mode === 'hidden';
  reduced = mode === 'reduced';
  const before = transitions.length;
  transitionTheme(() => commits.push(mode));
  eq(commits.at(-1), mode);
  eq(transitions.length, before);
  eq(active(), undefined);
}
reduced = document.hidden = false;
document.startViewTransition = () => { throw Error('capture unavailable'); };
transitionTheme(() => commits.push('fallback'));
eq(commits.at(-1), 'fallback');
eq(active(), undefined);
document.startViewTransition = nativeStart;
transitionTheme(() => commits.push('snapshot-skipped'));
last().callback();
last().ready.reject(Error('capture skipped'));
last().finished.resolve();
await Promise.resolve();
eq(commits.at(-1), 'snapshot-skipped');
eq(active(), undefined);

// Exercise the actual selection code and its preference/DOM synchronization.
const controls = {};
vm.runInNewContext(compile(`${read('src/components/theme/ThemeControls.tsx')}\nexport { selectTheme, applyTheme, preference };`), {
  exports: controls, document, matchMedia, Event,
  localStorage: {
    getItem: (key) => { if (storageBlocked) throw Error('blocked'); return storage.get(key); },
    setItem: (key, value) => { if (storageBlocked) throw Error('blocked'); storage.set(key, value); },
  },
  window: { dispatchEvent: () => { notices++; } },
  require: (name) => {
    if (name === '@/lib/theme-transition') return exports;
    if (name === 'react' || name === 'react/jsx-runtime' || name.endsWith('.css')) return {};
    throw Error(`Unexpected import: ${name}`);
  },
});
controls.selectTheme('dark');
last().callback();
last().ready.resolve();
eq(document.documentElement.dataset.theme, 'dark');
eq(document.documentElement.style.colorScheme, 'dark');
eq(storage.get('haerang-theme'), 'dark');
eq(notices, 1);
const dark = last();
controls.selectTheme('light');
eq(dark.transition.skipped, true);
last().callback();
last().ready.resolve();
last().finished.resolve();
dark.finished.resolve();
await Promise.resolve();
eq(document.documentElement.dataset.theme, 'light');
eq(storage.get('haerang-theme'), 'light');
eq(active(), undefined);
const beforeNoop = transitions.length;
controls.selectTheme('system'); // OS is light; preference changes without animation.
eq(transitions.length, beforeNoop);
eq(storage.get('haerang-theme'), 'system');
controls.selectTheme('dark');
const pending = last();
controls.selectTheme('light'); // Cancel a pending choice even before its snapshot.
pending.callback();
pending.finished.resolve();
await Promise.resolve();
eq(document.documentElement.dataset.theme, 'light');
eq(active(), undefined);
storageBlocked = reduced = true;
controls.selectTheme('dark');
eq(controls.preference(), 'dark');
eq(document.documentElement.dataset.theme, 'dark');
storageBlocked = reduced = false;
controls.applyTheme(); // External preference changes should not animate.
eq(document.documentElement.dataset.theme, 'light');
eq(active(), undefined);
const css = read('src/app/theme.css');
eq(css.includes('theme-circle-reveal 500ms'), true);
eq(css.includes('::view-transition-old(root)'), true);
eq(css.includes('prefers-reduced-motion: reduce'), true);
eq(css.includes('from { clip-path: circle(0% at 50% 50%); }'), true);
eq(css.includes('to { clip-path: circle(71% at 50% 50%); }'), true);
eq(css.includes('theme-shrink'), false);
eq(css.includes('theme-expand'), false);
const motion = css.slice(css.indexOf('/* Match the reference:'));
eq(motion.includes('scale('), false);
eq(/::view-transition-old\(root\)\s*\{\s*z-index: 1/.test(motion), true);
eq(/::view-transition-new\(root\)\s*\{\s*z-index: 2/.test(motion), true);
// Percentage circle radii resolve against hypot(width,height)/sqrt(2).
const radiusPercent = Number(motion.match(/to \{ clip-path: circle\((\d+)%/)[1]) / 100;
for (const [width, height] of [[320,740], [390,844], [944,900], [1920,1080]]) {
  eq(radiusPercent * Math.hypot(width, height) / Math.SQRT2 > Math.hypot(width / 2, height / 2), true);
}
console.log(`PASS: ${assertions} theme checks (native transition simulation, rapid choices, fallback, storage and reduced motion).`);
