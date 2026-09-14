import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const tokens = (css) => Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{3,6})\s*;/gi)].map((m) => [m[1], m[2]]));
const light = tokens(read('src/app/admin/admin-tokens.css'));
const darkBlock = read('src/app/theme.css').match(/html\[data-theme="dark"\] \.adminScope\s*\{([^}]+)\}/)[1];
const dark = { ...light, ...tokens(darkBlock) };

function luminance(hex) {
  const full = hex.length === 4 ? hex.slice(1).split('').map((c) => c + c).join('') : hex.slice(1);
  const rgb = full.match(/../g).map((c) => parseInt(c, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

let checks = 0;
for (const [theme, palette] of Object.entries({ light, dark })) {
  const pairs = [
    ['본문', palette['--a-ink'], palette['--a-surface']],
    ['보조 문구', palette['--a-ink-soft'], palette['--a-surface']],
    ['검색 안내', palette['--a-ink-soft'], palette['--a-bg']],
    ['메뉴', palette['--a-sidebar-ink'], palette['--a-sidebar']],
    ['선택 메뉴', '#fff', palette['--a-sidebar-active']],
    ['프로필 설명', palette['--a-sidebar-meta'], palette['--a-sidebar-profile']],
    ['주요 버튼', '#fff', palette['--a-action']],
    ['주요 버튼 호버', '#fff', palette['--a-action-hover']],
    ...['brand', 'green', 'orange', 'purple'].map((tone) => [tone, palette[`--a-${tone}`], palette[`--a-${tone}-soft`]]),
  ];
  for (const [name, foreground, background] of pairs) {
    const [min, max] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
    const ratio = (max + 0.05) / (min + 0.05);
    assert.ok(ratio >= 4.5, `${theme} ${name}: ${ratio.toFixed(2)}:1`);
    console.log(`${theme} ${name}: ${ratio.toFixed(2)}:1`);
    checks++;
  }
}

const nav = read('src/app/admin/AdminNav.tsx');
const labels = [...nav.matchAll(/href: "([^"]+)", label: "([^"]+)"/g)].map((m) => [m[1], m[2]]);
assert.deepEqual(labels, [
  ['/admin', '대시보드'], ['/admin/members', '회원 관리'], ['/admin/activities', '활동 관리'],
  ['/admin/messages', '메신저'], ['/admin/teams', '팀짜기'], ['/admin/board', '운영진 게시판'],
  ['/admin/content', '콘텐츠 관리'], ['/admin/partners', '협력기관'], ['/admin/stats', '통계'],
]);
assert.doesNotMatch(nav, /<svg|<img|item\.icon|\p{Extended_Pictographic}/u);
assert.match(nav, /aria-current=\{active \? "page" : undefined\}/);
assert.match(nav, /aria-label="관리자 메뉴"/);
const layout = read('src/app/admin/layout.module.css');
assert.match(layout, /width: 248px/);
assert.match(layout, /height: 76px/);
assert.match(layout, /@media \(max-width: 900px\)/);
assert.match(layout, /\.semesterSelect\s*\{\s*height: 44px/);
assert.match(read('src/components/admin/DataTable/DataTable.module.css'), /\.rowAction\s*\{[^}]*min-height: 44px/);
console.log(`${checks + 9} admin UI checks passed (token/source checks; browser and live-data tests are separate).`);
