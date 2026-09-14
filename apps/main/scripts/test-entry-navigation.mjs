import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('src/app/admin/AdminShell.tsx'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
// Execute the actual event handlers without a DOM, network, auth or hook renderer.
let state = [], cursor = 0, refCursor = 0, finePointer = true, focused = -1;
const refs = [0, 1].map((id) => ({ current: { focus: () => { focused = id; } } }));
const jsx = (type, props) => ({ type, props });
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  window: { matchMedia: () => ({ matches: finePointer }) },
  require: (name) => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return {
      useState: (initial) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useRef: () => refs[refCursor++],
    };
    if (name.endsWith('.css')) return { default: new Proxy({}, { get: (_, key) => key }) };
    if (name === 'next/link') return { default: 'Link' };
    if (name.endsWith('Logo/Logo')) return { Logo: 'Logo' };
    if (name === './AdminNav') return { AdminNav: 'AdminNav' };
    if (name === './AdminTopbar') return { AdminTopbar: 'AdminTopbar' };
    throw Error(`Unexpected import: ${name}`);
  },
});
const render = () => {
  cursor = refCursor = 0;
  return exports.AdminShell({ name: '로컬', cohort: '테스트', role: '관리자', children: 'Content' });
};
const find = (node, predicate) => {
  if (!node || typeof node !== 'object') return undefined;
  if (predicate(node)) return node;
  for (const child of [node.props?.children, node.props?.menuTrigger].flat(2)) {
    const match = find(child, predicate);
    if (match) return match;
  }
};
const props = (predicate) => find(render(), predicate).props;
const aside = () => props((n) => n.type === 'aside');
const slot = () => props((n) => n.props?.className === 'sidebarSpace');
const desktop = () => props((n) => n.props?.['aria-controls'] === 'admin-desktop-menu');
const mobile = () => props((n) => n.props?.['aria-controls'] === 'admin-mobile-menu');
const panel = () => props((n) => n.props?.id === 'admin-mobile-menu');
const body = () => props((n) => n.props?.id === 'admin-desktop-menu');
let assertions = 0;
const eq = (actual, expected) => { assert.equal(actual, expected); assertions++; };

eq(desktop()['aria-expanded'], false);
eq(slot()['data-expanded'], false);
eq(body().inert, true);
aside().onPointerEnter({ pointerType: 'touch' });
eq(desktop()['aria-expanded'], false);
finePointer = false;
aside().onPointerEnter({ pointerType: 'mouse' });
eq(desktop()['aria-expanded'], false);
finePointer = true;
aside().onPointerEnter({ pointerType: 'mouse' });
eq(desktop()['aria-expanded'], true);
eq(slot()['data-expanded'], true);
eq(body().inert, false);
aside().onPointerLeave({ pointerType: 'mouse' });
eq(desktop()['aria-expanded'], false);
eq(slot()['data-expanded'], false);
aside().onPointerEnter({ pointerType: 'mouse' });
body().onFocusCapture({ target: { matches: () => false } });
aside().onPointerLeave({ pointerType: 'mouse' });
eq(desktop()['aria-expanded'], false); // Clicking a link must not latch hover open.
aside().onPointerEnter({ pointerType: 'mouse' });
body().onFocusCapture({ target: { matches: () => true } });
aside().onPointerLeave({ pointerType: 'mouse' });
eq(desktop()['aria-expanded'], true);
body().onBlurCapture({ currentTarget: { contains: () => false }, relatedTarget: null });
eq(desktop()['aria-expanded'], false);
aside().onPointerEnter({ pointerType: 'mouse' });
body().onFocusCapture({ target: { matches: () => true } });
aside().onKeyDown({ key: 'Escape' });
eq(desktop()['aria-expanded'], false);
eq(focused, 0);
desktop().onClick();
eq(desktop()['aria-expanded'], true);
aside().onPointerLeave({ pointerType: 'mouse' });
eq(desktop()['aria-expanded'], false); // No permanent pin state.
desktop().onClick();
eq(desktop()['aria-expanded'], true);
find(find(render(), (n) => n.props?.id === 'admin-desktop-menu'), (n) => n.type === 'AdminNav').props.onNavigate();
eq(desktop()['aria-expanded'], false);
eq(focused, 0);
eq(panel().hidden, true);
mobile().onClick();
eq(mobile()['aria-expanded'], true);
eq(panel().hidden, false);
panel().onKeyDown({ key: 'Escape' });
eq(panel().hidden, true);
eq(focused, 1);
mobile().onClick();
find(find(render(), (n) => n.props?.id === 'admin-mobile-menu'), (n) => n.type === 'AdminNav').props.onNavigate();
eq(panel().hidden, true);
eq(focused, 1);

const login = read('src/app/LoginScreen.tsx');
eq(login.includes('LoginFilm'), false);
eq(login.includes('오늘도 함께,'), true);
eq(login.includes('ClubLogo'), false);
eq(login.includes('/brand/dolphin-hello.webp'), true);
eq(read('src/app/(app)/loading.tsx').includes('<LoadingState'), true);
eq(read('src/components/onboarding/AppSplash.tsx').includes('<svg'), false);
eq(read('src/components/ui/LoadingState/LoadingState.module.css').includes('prefers-reduced-motion'), true);
eq(read('src/app/page.module.css').includes('min-height: 54px'), true);
eq(read('src/components/onboarding/AppSplash.tsx').includes('ClubLogo'), false);
eq(read('src/app/admin/AdminTopbar.tsx').includes('운영진 대시보드'), false);
const sidebarSlot = read('src/app/admin/layout.module.css').match(/\.sidebarSpace\s*\{([^}]+)\}/)[1];
eq(sidebarSlot.includes('z-index: 30'), true); // Parent stacking context must outrank the topbar (10).
eq(sidebarSlot.includes('width: 72px'), true);
eq(/\.sidebarSpace\[data-expanded="true"\]\s*\{\s*width: 248px/.test(read('src/app/admin/layout.module.css')), true);
eq(read('src/app/page.module.css').match(/\.intro\s*\{([^}]+)\}/)[1].includes('justify-content: center'), true);
eq(read('src/app/page.module.css').match(/\.intro p\s*\{([^}]+)\}/)[1].includes('text-align: center'), true);
eq(read('src/app/page.module.css').includes('padding-top: 94px'), false);

function luminance(hex) {
  const [r, g, b] = hex.match(/[a-f\d]{2}/gi).map((x) => parseInt(x, 16) / 255).map((x) => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return r * .2126 + g * .7152 + b * .0722;
}
for (const [text, background] of [['596d88','f8fbff'], ['596d88','ffffff'], ['b1c6e0','102033'], ['b1c6e0','192f49'], ['ffffff','1465e7']]) {
  const values = [luminance(text), luminance(background)].sort((a, b) => a - b);
  const contrast = (values[1] + .05) / (values[0] + .05);
  assert.ok(contrast >= 4.5, `${text}/${background}: ${contrast.toFixed(2)}`);
  assertions++;
}
console.log(`PASS: ${assertions} entry/navigation checks (handler simulation, wiring and palette; browser checks separate).`);
