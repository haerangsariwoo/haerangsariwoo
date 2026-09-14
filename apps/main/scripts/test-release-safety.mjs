import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { environmentProblems, privateArtifact, sourceSecrets } from './release/check.mjs';

let checks = 0;
const eq = (actual, expected) => { assert.equal(actual, expected); checks++; };
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const compile = (path) => ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const preview = {
  NODE_ENV: 'development', LOCAL_ADMIN_BYPASS: '1',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-placeholder',
};
function bypass(env) {
  const api = {};
  vm.runInNewContext(compile('src/lib/local-admin.ts'), {
    exports: api, process: { env }, require: () => ({ defaultPhotoFocus: {} }),
  });
  return api.isLocalAdminBypass();
}
eq(bypass(preview), true);
for (const changed of [
  { NODE_ENV: 'production' }, { NODE_ENV: 'test' }, { LOCAL_ADMIN_BYPASS: '0' },
  { SUPABASE_SECRET_KEY: 'test-only-private-value' }, { VERCEL: '1' },
  { NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co' },
  { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-real-local-key' },
]) eq(bypass({ ...preview, ...changed }), false);

function adminClient(env) {
  const api = {}, calls = [];
  vm.runInNewContext(compile('src/lib/supabase/admin.ts'), {
    exports: api, process: { env },
    require: () => ({ createClient: (...args) => calls.push(args) }),
  });
  let rejected = false;
  try { api.createAdminClient(); } catch { rejected = true; }
  return { rejected, calls };
}
for (const env of [preview, { ...preview, SUPABASE_SECRET_KEY: 'test-only' }, {}]) {
  const result = adminClient(env);
  eq(result.rejected, true); eq(result.calls.length, 0);
}
const configuredAdmin = adminClient({ NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-only', SUPABASE_SECRET_KEY: 'test-only' });
eq(configuredAdmin.rejected, false); eq(configuredAdmin.calls.length, 1);
eq(read('src/lib/supabase/admin.ts').startsWith('import "server-only";'), true);

for (const env of [
  { VERCEL: '1', LOCAL_ADMIN_BYPASS: '1' },
  { VERCEL: '1', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-placeholder' },
  { VERCEL: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' },
]) {
  assert.throws(() => vm.runInNewContext(compile('next.config.ts'), { exports: {}, process: { env } })); checks++;
}
vm.runInNewContext(compile('next.config.ts'), { exports: {}, process: { env: preview } }); checks++;

// Fake keys verify shape/project matching only, never key validity.
const release = {
  LOCAL_ADMIN_BYPASS: '0', NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  RELEASE_EXPECTED_SUPABASE_REF: 'abcdefghijklmnopqrst',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'x'.repeat(20),
  SUPABASE_SECRET_KEY: 'sb_secret_' + 'x'.repeat(20),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test-only-public', VAPID_PRIVATE_KEY: 'test-only-private',
};
eq(environmentProblems(release).length, 0);
for (const changed of [
  { LOCAL_ADMIN_BYPASS: '1' }, { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' },
  { RELEASE_EXPECTED_SUPABASE_REF: 'anotherprojectrefxxxx' }, { RELEASE_EXPECTED_SUPABASE_REF: '' },
  { SUPABASE_SECRET_KEY: '' }, { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: release.SUPABASE_SECRET_KEY },
  { NEXT_PUBLIC_SUPABASE_SECRET_KEY: 'test-only-private' }, { VAPID_PRIVATE_KEY: '' },
]) eq(environmentProblems({ ...release, ...changed }).length > 0, true);
for (const path of ['apps/main/.env.local', '.env', '.release-private/schema.sql', 'backup.dump', 'key.pem', 'db-dumps/live.sql']) eq(privateArtifact(path), true);
for (const path of ['apps/main/.env.example', 'supabase/migrations/20260914_schema.sql', 'src/app/page.tsx']) eq(privateArtifact(path), false);
eq(sourceSecrets('const key = "sb_secret_' + 'x'.repeat(20) + '"'), true);
eq(sourceSecrets('process.env.SUPABASE_SECRET_KEY'), false);
const jwt = 'eyJtest.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.signature';
eq(sourceSecrets(jwt), true);

async function pushAuthorization({ user = true, role = '부원', status = 'approved', error = null, configured = true } = {}) {
  const api = {}, calls = { read: 0, count: 0, send: 0 };
  vm.runInNewContext(compile('src/app/actions/push.ts'), {
    exports: api,
    require(name) {
      if (name === '@/lib/supabase/server') return { createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: user ? { id: 'mock-member' } : null } }) },
        from: (table) => { eq(table, 'members'); calls.read++; return { select: () => ({ eq: () => ({ single: async () => ({ data: { role, status }, error }) }) }) }; },
      }) };
      if (name === '@/lib/supabase/admin') return {};
      if (name === '@/lib/push/store') return { subscriptionCount: async () => { calls.count++; return 1; } };
      if (name === '@/lib/push/server') return { pushConfigured: configured, sendToAll: async () => { calls.send++; return { sent: 1 }; } };
      throw Error(name);
    },
  });
  const result = await api.sendNoticePush({ title: '테스트', body: '외부 발송 없음' });
  return { calls, result };
}
for (const input of [{ user: false }, { role: '부원' }, { role: '관리자', status: 'pending' }, { role: '운영진', status: 'rejected' }, { role: '관리자', error: 'query failed' }]) {
  const { calls, result } = await pushAuthorization(input);
  eq(result.ok, false); eq(calls.count, 0); eq(calls.send, 0);
}
for (const role of ['운영진', '관리자']) {
  const { calls, result } = await pushAuthorization({ role });
  eq(result.ok, true); eq(calls.send, 1);
}
const missingPush = await pushAuthorization({ role: '관리자', configured: false });
eq(missingPush.result.ok, false); eq(missingPush.calls.send, 0);
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
for (const name of ['@supabase/ssr', '@supabase/supabase-js']) {
  eq(pkg.dependencies[name], lock.packages[''].dependencies[name]);
  eq(pkg.dependencies[name], lock.packages[`node_modules/${name}`].version);
}
console.log(`PASS: ${checks} release-safety checks (mocked DB/push; no production writes or notifications).`);
