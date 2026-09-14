import {
  coarseCoordinate,
  parseWeather,
  validCoordinates,
} from "@/lib/weather";

const headers = { "Cache-Control": "private, no-store" };
// POST keeps location out of this app's URL and access logs. No database or disk cache.
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > 1024)
    return Response.json(
      { error: "요청이 너무 길어요." },
      { status: 413, headers },
    );
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "지역을 다시 선택해 주세요." },
      { status: 400, headers },
    );
  }
  if (!body || !validCoordinates(body.latitude, body.longitude))
    return Response.json(
      { error: "올바른 위치가 아니에요. 지역을 다시 선택해 주세요." },
      { status: 400, headers },
    );
  const query = new URLSearchParams({
    latitude: String(coarseCoordinate(body.latitude)),
    longitude: String(coarseCoordinate(body.longitude)),
    current:
      "temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: "2",
    timezone: "Asia/Seoul",
    wind_speed_unit: "ms",
  });
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${query}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw new Error("Weather service unavailable");
    return Response.json(parseWeather(await response.json()), { headers });
  } catch {
    return Response.json(
      { error: "날씨를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 503, headers },
    );
  }
}
