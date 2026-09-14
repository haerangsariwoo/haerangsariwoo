import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const compile = (path) => ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
let assertions = 0;
const eq = (actual, expected) => { assert.equal(actual, expected); assertions++; };
const flush = () => new Promise((resolve) => setImmediate(resolve));
const setup = {};
vm.runInNewContext(compile('src/lib/first-visit.ts'), { exports: setup });
eq(setup.initialSetupPhase(null, false), 'welcome');
eq(setup.initialSetupPhase(null, true), 'done');
eq(setup.initialSetupPhase('bad-json', false), 'welcome');
eq(setup.initialSetupPhase('old-version', true), 'done');
for (const phase of ['welcome', 'tour', 'install', 'notifications', 'done']) {
  eq(setup.initialSetupPhase(phase, true), phase);
}
eq(setup.nextSetupPhase('tour', true, false), 'tour');
eq(setup.nextSetupPhase('tour', false, false), 'install');
eq(setup.nextSetupPhase('tour', false, true), 'notifications');
eq(setup.nextSetupPhase('install', false, true), 'notifications');
eq(setup.nextSetupPhase('install', false, false), 'install');
eq(setup.nextSetupPhase('notifications', false, true), 'notifications');
eq(setup.nextSetupPhase('done', false, false), 'done');

function installHarness() {
  const window = new EventTarget();
  const api = {};
  vm.runInNewContext(compile('src/lib/push/install-prompt.ts'), { exports: api, window });
  let changes = 0, prompts = 0;
  const unsubscribe = api.subscribeInstallPrompt(() => changes++);
  function send(outcome, fail = false) {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { prompts++; if (fail) throw Error('unavailable'); };
    event.userChoice = Promise.resolve({ outcome });
    window.dispatchEvent(event);
    return event;
  }
  return { api, window, send, unsubscribe, prompts: () => prompts, changes: () => changes };
}
let install = installHarness();
eq(install.prompts(), 0); // Mounting never requests installation.
const early = install.send('dismissed');
eq(early.defaultPrevented, true);
eq(install.api.installSnapshot().event, early);
const lateUnsubscribe = install.api.subscribeInstallPrompt(() => {});
eq(install.api.installSnapshot().event, early); // The tutorial may finish much later.
eq(await install.api.requestInstall(), false);
eq(install.api.installSnapshot().installed, false);
eq(install.api.installSnapshot().event, null);
eq(install.prompts(), 1);
lateUnsubscribe();
install.unsubscribe();

install = installHarness();
install.send('accepted');
const pending = install.api.requestInstall();
eq(install.api.installSnapshot().busy, true);
eq(await install.api.requestInstall(), false); // One prompt only, even on double click.
eq(await pending, true);
eq(install.api.installSnapshot().installed, true);
eq(install.api.installSnapshot().busy, false);
eq(install.prompts(), 1);
install.unsubscribe();
install = installHarness();
install.send('dismissed', true);
eq(await install.api.requestInstall(), false);
eq(install.api.installSnapshot().busy, false);
eq(install.api.installSnapshot().error.includes('브라우저 메뉴'), true);
install.window.dispatchEvent(new Event('appinstalled'));
eq(install.api.installSnapshot().installed, true);
install.unsubscribe();

const pushCode = compile('src/components/push/PushSettings/PushSettings.tsx');
async function pushHarness(options = {}) {
  const config = { supported: true, configured: true, permission: 'granted', existing: null, saveOk: true, ...options };
  let state = [], cursor = 0, cleanup, effect, mounted = { current: false };
  const calls = { permission: 0, subscribe: 0, saved: 0, complete: 0, rollback: 0 };
  const sub = { endpoint: 'https://push.example.test/demo', toJSON: () => ({ endpoint: 'https://push.example.test/demo', keys: { p256dh: 'test', auth: 'test' } }), unsubscribe: async () => { calls.rollback++; } };
  const registration = { pushManager: {
    getSubscription: async () => config.existing ? sub : null,
    subscribe: async () => { calls.subscribe++; return sub; },
  } };
  const api = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(pushCode, {
    exports: api,
    process: { env: { NEXT_PUBLIC_VAPID_PUBLIC_KEY: config.configured ? 'AA' : undefined } },
    Notification: { requestPermission: async () => { calls.permission++; return config.permission; } },
    navigator: { serviceWorker: { ready: Promise.resolve(registration) } },
    window: { atob: (value) => Buffer.from(value, 'base64').toString('binary') },
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react') return {
        useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], (value) => { state[index] = value; }]; },
        useRef: () => mounted,
        useEffect: (callback) => { effect = callback; },
      };
      if (name === '@radix-ui/react-switch') return { Root: 'Switch', Thumb: 'Thumb' };
      if (name.endsWith('.css')) return { default: {} };
      if (name === '@/lib/cn') return { cn: (...values) => values.join(' ') };
      if (name === '@/lib/push/client-env') return {
        useIsIOS: () => Boolean(config.ios), useIsIPad: () => false,
        useIsStandalone: () => Boolean(config.standalone),
        useNotificationDenied: () => config.permission === 'denied', useSupportsPush: () => config.supported,
      };
      if (name === '@/lib/push/install-help') return { IOS_STEPS: () => ['홈 화면에 추가'] };
      if (name === '@/lib/push/register-sw') return { registerServiceWorker: async () => registration };
      if (name === '@/app/actions/push') return {
        subscribeUser: async () => { calls.saved++; return { ok: config.saveOk, error: '테스트 저장 실패' }; },
        unsubscribeUser: async () => {},
      };
      throw Error(`Unexpected import: ${name}`);
    },
  });
  const render = () => { cursor = 0; return api.PushSettings({ onSubscribed: () => calls.complete++ }); };
  render();
  cleanup = effect();
  await flush();
  const find = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'Switch') return node;
    for (const child of [node.props?.children].flat(2)) { const result = find(child); if (result) return result; }
    return null;
  };
  return { render, calls, toggle: () => find(render()), close: cleanup, text: () => JSON.stringify(render()) };
}
let push = await pushHarness();
eq(push.calls.permission, 0);
eq(push.calls.subscribe, 0);
eq(push.toggle().props.disabled, false);
await push.toggle().props.onCheckedChange(true);
eq(push.calls.permission, 1);
eq(push.calls.subscribe, 1);
eq(push.calls.saved, 1);
eq(push.calls.complete, 1);
push.close();
push = await pushHarness({ existing: true });
eq(push.calls.complete, 1);
eq(push.calls.permission, 0);
eq(push.calls.subscribe, 0);
push.close();
push = await pushHarness({ permission: 'denied' });
eq(push.toggle().props.disabled, true);
eq(push.calls.permission, 0);
eq(push.text().includes('알림이 차단되어'), true);
push.close();
push = await pushHarness({ permission: 'default' });
await push.toggle().props.onCheckedChange(true);
eq(push.calls.subscribe, 0);
eq(push.calls.complete, 0);
push.close();
push = await pushHarness({ configured: false });
eq(push.toggle().props.disabled, true);
await push.toggle().props.onCheckedChange(true);
eq(push.calls.permission, 0);
eq(push.text().includes('알림 설정을 준비하고'), true);
push.close();
push = await pushHarness({ configured: false, permission: 'denied' });
eq(push.text().includes('알림 설정을 준비하고'), false);
eq(push.text().includes('알림이 차단되어'), true);
push.close();
push = await pushHarness({ supported: false, ios: true });
eq(push.toggle(), null);
eq(push.calls.permission, 0);
eq(push.text().includes('홈 화면에 추가해야'), true);
push.close();
push = await pushHarness({ saveOk: false });
await push.toggle().props.onCheckedChange(true);
eq(push.calls.rollback, 1);
eq(push.calls.complete, 0);
push.close();
push = await pushHarness();
push.close();
await push.toggle().props.onCheckedChange(true);
eq(push.calls.subscribe, 0); // Closing before permission resolves cannot continue setup.
eq(push.calls.complete, 0);

const component = read('src/components/onboarding/FirstVisitSetup.tsx');
eq(component.includes('Notification.requestPermission'), false);
eq(component.includes('onSubscribed={completeNotifications}'), true);
eq(component.includes('go("tour"); start();'), true);
eq(component.includes('dismiss(); go("install");'), true);
eq(component.includes('onOpenChange'), true);
eq(component.includes('window.addEventListener(SETUP_RESTART'), true);
eq(read('src/app/(app)/home/page.tsx').includes('<TourInvite'), false);
eq(read('src/app/(app)/layout.tsx').includes('<FirstVisitSetup />'), true);
eq(read('src/app/(app)/my/page.tsx').includes('<FirstVisitRestart />'), true);
console.log(`PASS: ${assertions} first-visit checks (phase decisions, real install store, push handler simulation; no native prompts or external writes).`);
