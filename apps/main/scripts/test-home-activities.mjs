import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Run the real presentation components and their handlers, with no network or DB.
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
let state = [],
  cursor = 0,
  assertions = 0;
const eq = (a, b) => {
  assert.equal(a, b);
  assertions++;
};
const ok = (v, reason) => {
  assert.ok(v, reason);
  assertions++;
};
const jsx = (type, props) =>
  typeof type === "function" ? type(props) : { type, props };
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(read(path), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useMemo: (fn) => fn(),
            useState: (initial) => {
              const i = cursor++;
              if (!(i in state))
                state[i] = typeof initial === "function" ? initial() : initial;
              return [
                state[i],
                (v) => {
                  state[i] = typeof v === "function" ? v(state[i]) : v;
                },
              ];
            },
          };
        if (name.endsWith(".css"))
          return { default: new Proxy({}, { get: (_, k) => k }) };
        if (name === "next/link") return { default: "a" };
        if (name === "next/image") return { default: "img" };
        if (name === "@/lib/cn")
          return { cn: (...v) => v.filter(Boolean).join(" ") };
        if (name.startsWith("@/lib/"))
          return load(`src/lib/${name.slice(6)}.ts`);
        throw Error(`Unexpected import: ${name}`);
      },
    },
  );
  cache.set(path, exports);
  return exports;
}
function walk(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(3).flatMap(walk)];
}
const text = (n) =>
  typeof n === "string" || typeof n === "number"
    ? String(n)
    : [n?.props?.children]
        .flat(3)
        .map((v) => (v ? text(v) : ""))
        .join("");
const { activityDate, monthDays, moveMonth } = load(
  "src/lib/activity-calendar.ts",
);
const { fixtureActivities, fixtureAlbums, today } = load(
  "scripts/fixtures/home-activities.ts",
);
const { ActivityList } = load("src/app/(app)/activities/ActivityList.tsx");
const { AlbumPreviewGrid } = load("src/app/(app)/home/AlbumPreviewGrid.tsx");
const base = fixtureActivities[1];

eq(monthDays("2026-09").length, 35);
eq(monthDays("2026-09")[0].iso, "2026-08-30");
eq(monthDays("2026-09").filter((d) => d.inMonth).length, 30);
eq(monthDays("2028-02").filter((d) => d.inMonth).length, 29);
eq(monthDays("2026-08").length, 42);
eq(moveMonth("2026-12", 1), "2027-01");
eq(moveMonth("2026-01", -1), "2025-12");
eq(activityDate(base, today), "2026-09-18");
eq(
  activityDate(
    { ...base, dateShort: "1.02", dateLabel: "1.02 (토)" },
    "2026-12-30",
  ),
  "2027-01-02",
);
eq(
  activityDate(
    { ...base, dateShort: "12.30", dateLabel: "12.30", status: "done" },
    "2026-01-02",
  ),
  "2025-12-30",
);
eq(
  activityDate({ ...base, dateLabel: "2024.09.18 (수)" }, today),
  "2024-09-18",
);
eq(
  activityDate({ ...base, dateLabel: "2027-01-02 (토)" }, today),
  "2027-01-02",
);
for (const short of ["2.30", "13.01", "0.01", "9.00", "미정"]) {
  eq(activityDate({ ...base, dateShort: short }, today), null);
}
eq(
  activityDate({ ...base, dateLabel: "2028.02.29", dateShort: "2.29" }, today),
  "2028-02-29",
);
eq(
  activityDate({ ...base, dateLabel: "2026.02.29", dateShort: "2.29" }, today),
  null,
);

let data = fixtureActivities;
const original = JSON.stringify(data);
const render = () => {
  cursor = 0;
  return ActivityList({ activities: data, today });
};
const node = (predicate) => walk(render()).find(predicate);
const byLabel = (label) => node((n) => n.props?.["aria-label"] === label);
const click = (label) => byLabel(label).props.onClick();
const agenda = () =>
  node((n) => n.props?.["aria-labelledby"] === "activity-agenda-title");
const agendaLinks = () => walk(agenda()).filter((n) => n.type === "a");
const buttonText = (label) =>
  node((n) => n.type === "button" && text(n) === label);
eq(agendaLinks().length, 4);
eq(agendaLinks()[0].props.href, "/activities/fixture-friends");
eq(agendaLinks()[1].props.href, "/activities/fixture-opening");
ok(node((n) => n.type === "section" && n.props["aria-label"] === "활동 달력"));
ok(
  node(
    (n) =>
      n.props?.["data-tour"] === "activity-calendar" &&
      n.props.href === "/calendar",
  ),
);
eq(byLabel("2026년 9월 18일, 활동 2건").props["aria-pressed"], false);
click("2026년 9월 18일, 활동 2건");
eq(agendaLinks().length, 2);
ok(text(agenda()).includes("9월 18일 활동"));
eq(byLabel("2026년 9월 18일, 활동 2건").props["aria-pressed"], true);
buttonText("개파").props.onClick();
eq(agendaLinks().length, 1);
ok(byLabel("2026년 9월 18일, 활동 1건"));
buttonText("종파").props.onClick();
eq(agendaLinks().length, 0);
ok(text(agenda()).includes("이날은 등록된 활동이 없어요."));
buttonText("모든 유형 보기").props.onClick();
eq(agendaLinks().length, 2);
click("2026년 9월 18일, 활동 2건");
eq(agendaLinks().length, 4); // A second press clears the day filter.
click("다음 달");
ok(text(render()).includes("2026년 10월"));
click("2026년 10월 9일, 활동 1건");
eq(agendaLinks().length, 1);
ok(text(agenda()).includes("10.09 (금) ~ 10.10 (토)"));
buttonText("오늘").props.onClick();
ok(text(render()).includes("2026년 9월"));
eq(byLabel("2026년 9월 14일, 활동 0건, 오늘").props["aria-current"], "date");
eq(agendaLinks().length, 0);
buttonText("전체 일정").props.onClick();
eq(agendaLinks().length, 4);
ok(node((n) => n.type === "details"));
ok(text(render()).includes("접수 마감"));
for (const status of [
  "참석",
  "미정",
  "불참",
  "참석 여부 선택하기",
  "조 편성 완료",
])
  ok(text(render()).includes(status));
eq(JSON.stringify(data), original);
// Browsing another year must not clone a legacy event into it.
for (let i = 0; i < 12; i++) click("다음 달");
ok(byLabel("2027년 9월 18일, 활동 0건"));
data = [];
state = [];
ok(text(render()).includes("아직 등록된 활동이 없어요."));
eq(agendaLinks().length, 0);

const albumTree = AlbumPreviewGrid({ albums: fixtureAlbums });
eq(walk(albumTree).filter((n) => n.type === "a").length, 4);
eq(walk(albumTree).filter((n) => n.type === "img").length, 3);
eq(
  walk(albumTree).filter((n) => n.type === "img")[1].props.style.transform,
  "scale(2.4)",
);
ok(text(albumTree).includes("사진 준비 중"));
ok(!text(albumTree).includes("다섯 번째"));
eq(
  walk(AlbumPreviewGrid({ albums: fixtureAlbums.slice(0, 1) })).filter(
    (n) => n.type === "a",
  ).length,
  1,
);
ok(
  text(AlbumPreviewGrid({ albums: [] })).includes("아직 올라온 사진이 없어요."),
);
const missingUrl = [
  { ...fixtureAlbums[0], photos: [{ ...fixtureAlbums[0].photos[0], url: "" }] },
];
eq(
  walk(AlbumPreviewGrid({ albums: missingUrl })).filter((n) => n.type === "img")
    .length,
  0,
);

// Guard the precise regression: fill photos must have a sized containing block.
const css = read("src/app/(app)/home/AlbumPreview.module.css");
const photo = css.match(/\.photo\s*\{([^}]+)\}/)[1];
for (const rule of [
  "position: relative",
  "aspect-ratio: 1",
  "overflow: hidden",
  "display: block",
])
  ok(photo.includes(rule), rule);
ok(css.includes("object-fit: cover"));
for (const [component, stylesheet] of [
  ["src/app/(app)/home/AlbumPreviewGrid.tsx", css],
  [
    "src/app/(app)/activities/ActivityList.tsx",
    read("src/app/(app)/activities/activities.module.css"),
  ],
]) {
  for (const key of new Set(
    [...read(component).matchAll(/styles\.([a-zA-Z]+)/g)].map((m) => m[1]),
  )) {
    ok(
      new RegExp(`\\.${key}(?=[\\s,:.>{])`).test(stylesheet),
      `Missing CSS class ${key} in ${component}`,
    );
  }
}
ok(
  read("src/app/(app)/activities/page.tsx").includes('timeZone: "Asia/Seoul"'),
);
ok(!read("src/app/(app)/activities/ActivityList.tsx").includes("createClient"));
ok(!read("src/app/(app)/activities/ActivityList.tsx").includes("useEffect"));
// Contrast pairs used by these views, including translucent status backgrounds.
const declarations = (source) =>
  Object.fromEntries(
    [...source.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  );
const themeSource = read("src/app/theme.css");
const light = {
  ...declarations(read("src/app/globals.css")),
  ...declarations(themeSource.match(/:root\s*\{([^}]+)\}/)[1]),
};
const dark = {
  ...light,
  ...declarations(
    themeSource.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)[1],
  ),
};
const rgba = (value) => {
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) hex = [...hex].map((n) => n + n).join("");
    const channels = hex.match(/../g).map((n) => parseInt(n, 16));
    return [
      ...channels.slice(0, 3),
      channels.length === 4 ? channels[3] / 255 : 1,
    ];
  }
  const numbers = value.match(/[\d.]+/g).map(Number);
  return [...numbers.slice(0, 3), numbers[3] ?? 1];
};
const luminance = (c) =>
  c
    .slice(0, 3)
    .map((n) => n / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
    .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
const composite = (color, base) =>
  color.slice(0, 3).map((n, i) => n * color[3] + base[i] * (1 - color[3]));
for (const [mode, tokens] of [
  ["light", light],
  ["dark", dark],
]) {
  const color = (key) => rgba(tokens[`--${key}`]);
  const surface = color("surface-white");
  const pairs = [
    ["title", color("ink-800"), surface],
    ["secondary", color("ink-600"), surface],
    ["date and placeholder", color("ink-500"), color("surface-muted")],
    ["selected", color("on-brand"), color("brand-blue-500")],
    [
      "success",
      color("state-success"),
      composite(color("state-success-bg"), surface),
    ],
    [
      "undecided",
      color("state-warn"),
      composite(color("state-warn-bg"), surface),
    ],
    [
      "declined",
      color("state-danger")
        .slice(0, 3)
        .map((n, i) => n * 0.8 + color("ink-800")[i] * 0.2),
      composite(color("state-danger-bg"), surface),
    ],
  ];
  for (const [name, foreground, background] of pairs) {
    const values = [luminance(foreground), luminance(background)].sort(
      (a, b) => b - a,
    );
    const contrast = (values[0] + 0.05) / (values[1] + 0.05);
    ok(contrast >= 4.5, `${mode} ${name}: ${contrast.toFixed(2)}:1`);
  }
}
ok(css.match(/\.placeholder\s*\{([^}]+)\}/)[1].includes("var(--ink-500)"));
const activityCss = read("src/app/(app)/activities/activities.module.css");
ok(
  activityCss
    .match(/\.date > span\s*\{([^}]+)\}/)[1]
    .includes("var(--ink-500)"),
);
ok(
  activityCss.includes(
    "color-mix(in srgb, var(--state-danger) 80%, var(--ink-800))",
  ),
);
console.log(
  `Home/activities: ${assertions} assertions passed (no network or DB writes).`,
);
