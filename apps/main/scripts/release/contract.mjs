import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import ts from 'typescript';

const app = fileURLToPath(new URL('../../', import.meta.url));
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : /\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : []);
}
function extract(source, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const calls = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      const receiver = node.expression.expression.getText(ast);
      const arg = node.arguments[0];
      if ((method === 'from' && !/^(Array|Uint8Array|Buffer)$/.test(receiver)) || method === 'rpc') {
        const name = arg && ts.isStringLiteralLike(arg) ? arg.text : arg?.getText(ast) ?? '(dynamic)';
        const kind = method === 'rpc' ? 'rpc' : receiver.includes('.storage') ? 'storage' : 'relation';
        const chain = [];
        let cursor = node;
        while (ts.isPropertyAccessExpression(cursor.parent) && ts.isCallExpression(cursor.parent.parent)) {
          cursor = cursor.parent.parent;
          const arg = cursor.arguments[0];
          chain.push({ operation: cursor.expression.name.text, literal: arg && ts.isStringLiteralLike(arg) ? arg.text : null });
        }
        calls.push({ kind, name, file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, chain });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return calls;
}
const files = walk(join(app, 'src')).sort();
const current = files.flatMap((file) => extract(readFileSync(file, 'utf8'), relative(app, file)));
const baseline = files.flatMap((file) => {
  try { return extract(execFileSync('git', ['show', `HEAD:apps/main/${relative(app, file)}`], { cwd: app, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }), relative(app, file)); }
  catch { return []; }
});
const names = (calls, kind) => [...new Set(calls.filter((c) => c.kind === kind).map((c) => c.name))].sort();
const diff = (now, before) => ({ added: now.filter((x) => !before.includes(x)), removed: before.filter((x) => !now.includes(x)) });
console.log(JSON.stringify({
  note: 'Static call-site inventory, NOT database types or a verified schema. Dynamic names/payloads, constraints, grants, triggers and RPC bodies require remote inspection. No member records are read.',
  relations: names(current, 'relation'), rpc: names(current, 'rpc'), storageExpressions: names(current, 'storage'),
  versusHEAD: { relations: diff(names(current, 'relation'), names(baseline, 'relation')), rpc: diff(names(current, 'rpc'), names(baseline, 'rpc')) },
  calls: current,
}, null, 2));
