import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const loadDependency = createRequire(import.meta.url);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
function load(
  file,
  mocks = {},
  fetcher = () => {
    throw Error("Unexpected network call");
  },
) {
  const source = fs.readFileSync(
    path.join(scriptDirectory, "..", file),
    "utf8",
  );
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const result = {};
  new Function("exports", "require", "fetch", js)(
    result,
    (name) => mocks[name] ?? loadDependency(name),
    fetcher,
  );
  return result;
}
const weather = load("src/lib/weather.ts");
const display = load("src/lib/external/presentation.ts");
const record = {
  recruitStart: "2026-09-01",
  recruitEnd: "2026-09-15",
  capacity: 10,
  applied: 3,
};
const sample = {
  current: {
    time: "2026-09-13T23:30",
    temperature_2m: 20.1,
    weather_code: 2,
    is_day: 0,
  },
  hourly: {
    time: ["2026-09-13T23:00", "2026-09-14T00:00"],
    temperature_2m: [20, 19],
    precipitation_probability: [0, 15],
  },
  daily: {},
};
async function main() {
  assert.equal(
    display.koreanToday(new Date("2026-09-13T16:00:00Z")),
    "2026-09-14",
  );
  assert.equal(display.recruitment(record, "2026-09-13").label, "2일 뒤 마감");
  assert.equal(display.recruitment(record, "2026-09-15").label, "오늘 마감");
  assert.equal(display.recruitment(record, "2026-09-16").label, "모집 마감");
  assert.equal(
    display.recruitment({ ...record, closed: true }, "2026-09-13").open,
    false,
  );
  assert.equal(
    display.recruitment({ ...record, applied: 10 }, "2026-09-13").label,
    "정원 마감",
  );
  assert.equal(
    display.recruitment({ ...record, recruitStart: "2026-09-14" }, "2026-09-13")
      .label,
    "모집 예정",
  );
  assert.equal(
    display.recruitment({ ...record, recruitEnd: "" }, "2026-09-13").label,
    "모집 정보 확인",
  );
  assert.equal(
    display.activityDate("2026-09-18", "2026-09-18"),
    "9월 18일(금)",
  );
  assert.equal(display.activityDate("", ""), "원문에서 일정 확인");
  assert.equal(display.activityDate("2026-02-30", ""), "일정 확인 필요");
  assert.equal(weather.validCoordinates(91, 0), false);
  assert.equal(weather.validCoordinates(null, 0), false);
  assert.equal(weather.validCoordinates(NaN, 0), false);
  assert.equal(weather.validCoordinates(37.57, 126.98), true);
  assert.equal(weather.coarseCoordinate(37.56789), 37.57);
  assert.equal(weather.weatherCondition(0).label, "맑음");
  assert.equal(weather.weatherCondition(95).label, "뇌우");
  assert.equal(weather.weatherCondition(71).label, "눈");
  const parsed = weather.parseWeather(sample);
  assert.equal(parsed.low, null);
  assert.equal(parsed.apparent, null);
  assert.equal(parsed.hourly.length, 1);
  assert.equal(parsed.hourly[0].time, "2026-09-14T00:00");
  assert.equal(parsed.hourly[0].rain, 15);
  assert.throws(() =>
    weather.parseWeather({ current: { temperature_2m: null } }),
  );
  const req = (body) =>
    new Request("http://localhost/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const route = load(
    "src/app/api/weather/route.ts",
    { "@/lib/weather": weather },
    async () => Response.json(sample),
  );
  assert.equal(
    (await route.POST(req({ latitude: 37.57, longitude: 126.98 }))).status,
    200,
  );
  assert.equal(
    (await route.POST(req({ latitude: 999, longitude: 0 }))).status,
    400,
  );
  assert.equal((await route.POST(req(null))).status, 400);
  const unavailable = load(
    "src/app/api/weather/route.ts",
    { "@/lib/weather": weather },
    async () => {
      throw Error("offline");
    },
  );
  assert.equal(
    (await unavailable.POST(req({ latitude: 37.57, longitude: 126.98 })))
      .status,
    503,
  );
  const malformed = load(
    "src/app/api/weather/route.ts",
    { "@/lib/weather": weather },
    async () => Response.json({}),
  );
  assert.equal(
    (await malformed.POST(req({ latitude: 37.57, longitude: 126.98 }))).status,
    503,
  );
  let lookupUrl;
  const lookup = load(
    "src/app/api/weather/places/route.ts",
    { "@/lib/weather": weather },
    async (url) => {
      lookupUrl = url;
      return Response.json({
        results: [
          {
            name: "부산광역시",
            admin1: "부산광역시",
            country_code: "KR",
            feature_code: "PPLA",
            population: 3000000,
            latitude: 35.10168,
            longitude: 129.03004,
          },
        ],
      });
    },
  );
  const places = await (
    await lookup.GET(
      new Request(
        "http://localhost/api/weather/places?q=" + encodeURIComponent("부산"),
      ),
    )
  ).json();
  assert.equal(new URL(lookupUrl).searchParams.get("name"), "Busan");
  assert.equal(places.places[0].label, "부산광역시");
  assert.equal(places.places[0].latitude, 35.1);
  assert.equal(
    (await lookup.GET(new Request("http://localhost/api/weather/places?q=x")))
      .status,
    400,
  );
  console.log(
    "PASS: 34 weather, date, status and API assertions. Network is mocked; no user location accessed.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
