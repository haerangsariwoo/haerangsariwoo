import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import nextEnv from '@next/env';

const app = fileURLToPath(new URL('../../', import.meta.url));
const root = resolve(app, '../..');
function jwtPayload(value) {
  try { return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()); }
  catch { return null; }
}

/** Offline configuration checks only; never logs a key or contacts a database. */
export function environmentProblems(env) {
  const problems = [];
  if (env.LOCAL_ADMIN_BYPASS === '1') problems.push('LOCAL_ADMIN_BYPASS must be 0 for release.');
  let ref;
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname);
    if (url.protocol !== 'https:' || !match || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/') throw Error();
    ref = match[1];
  } catch { problems.push('NEXT_PUBLIC_SUPABASE_URL must be the verified hosted project HTTPS URL.'); }
  if (!env.RELEASE_EXPECTED_SUPABASE_REF) problems.push('Set RELEASE_EXPECTED_SUPABASE_REF after confirming the target project.');
  else if (ref && ref !== env.RELEASE_EXPECTED_SUPABASE_REF) problems.push('Supabase project URL does not match RELEASE_EXPECTED_SUPABASE_REF.');

  for (const [name, prefix, role] of [
    ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_', 'anon'],
    ['SUPABASE_SECRET_KEY', 'sb_secret_', 'service_role'],
  ]) {
    const key = env[name] ?? '';
    if (key.startsWith(prefix) && key.length > prefix.length + 10) continue;
    const payload = jwtPayload(key);
    if (!payload || payload.role !== role || (ref && payload.ref !== ref)) {
      problems.push(`${name} is missing, a placeholder, or has the wrong role/project.`);
    }
  }
  for (const key of Object.keys(env)) {
    if (/^NEXT_PUBLIC_.*(?:SECRET|PRIVATE|SERVICE_ROLE|PASSWORD)/i.test(key) && env[key]) {
      problems.push(`${key}: private credentials must not use NEXT_PUBLIC_.`);
    }
  }
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    problems.push('Both VAPID keys are required to release the notification feature.');
  }
  return problems;
}

export function privateArtifact(path) {
  return /(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example') ||
    /(^|\/)(?:\.release-private|backups|db-dumps)(?:\/|$)/.test(path) ||
    /\.(?:dump|backup|pem)$/.test(path);
}

export function sourceSecrets(source) {
  return /\bsb_secret_[A-Za-z0-9_-]{15,}/.test(source) ||
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source) ||
    (source.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [])
      .some((token) => jwtPayload(token)?.role === 'service_role');
}

function main() {
  nextEnv.loadEnvConfig(app, false);
  const errors = environmentProblems(process.env);
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of new Set(files)) {
    if (privateArtifact(file)) errors.push(`Private artifact in Git candidate set: ${file}`);
    let stat;
    try { stat = statSync(resolve(root, file)); } catch { continue; } // Deleted worktree file.
    if (!stat.isFile()) continue;
    if (stat.size > 100 * 1024 * 1024) errors.push(`File exceeds GitHub's 100 MiB limit: ${file}`);
    if (/\.(?:[cm]?[jt]sx?|json|md|ya?ml|toml|sql|example)$/.test(file) && stat.size < 5 * 1024 * 1024) {
      if (sourceSecrets(readFileSync(resolve(root, file), 'utf8'))) errors.push(`Possible server credential in ${file} (value redacted).`);
    }
  }
  const changed = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', 'apps/recruit'], { cwd: root, encoding: 'utf8' }).trim();
  if (changed) errors.push('apps/recruit has changes: review separately from the member-app release.');
  if (errors.length) {
    console.error(`BLOCKED: ${errors.length} release configuration/artifact check(s).\n${errors.map((e) => `- ${e}`).join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('PASS: local configuration/artifact checks only. Key validity, RLS, constraints, migrations, backups and live data still require Supabase review.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
