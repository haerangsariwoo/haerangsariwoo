export type WeatherLocation = {
  label: string;
  latitude: number;
  longitude: number;
};
export const SEOUL: WeatherLocation = {
  label: "서울",
  latitude: 37.57,
  longitude: 126.98,
};
export type WeatherData = {
  time: string;
  temperature: number;
  apparent: number | null;
  code: number;
  isDay: boolean;
  wind: number | null;
  low: number | null;
  high: number | null;
  hourly: {
    time: string;
    temperature: number | null;
    rain: number | null;
    code: number | null;
  }[];
};

export function validCoordinates(latitude: unknown, longitude: unknown) {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
  );
}

/** About a kilometre, not a precise address. Do not persist the device's location. */
export function coarseCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

export function weatherCondition(code: number) {
  if (code === 0) return { label: "맑음", icon: "clear" } as const;
  if (code === 1 || code === 2)
    return { label: "구름 조금", icon: "cloud" } as const;
  if (code === 3) return { label: "흐림", icon: "cloud" } as const;
  if (code === 45 || code === 48)
    return { label: "안개", icon: "fog" } as const;
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { label: "눈", icon: "snow" } as const;
  if ([95, 96, 99].includes(code))
    return { label: "뇌우", icon: "storm" } as const;
  if ([51, 53, 55, 56, 57].includes(code))
    return { label: "이슬비", icon: "rain" } as const;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { label: "비", icon: "rain" } as const;
  return { label: "날씨 정보", icon: "cloud" } as const;
}

type WeatherPayload = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    is_day?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
  };
  daily?: { temperature_2m_min?: number[]; temperature_2m_max?: number[] };
};
const numberOrNull = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function parseWeather(payload: unknown): WeatherData {
  const raw = payload as WeatherPayload;
  const c = raw?.current;
  if (
    !c ||
    typeof c.time !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(c.time) ||
    numberOrNull(c.temperature_2m) === null ||
    numberOrNull(c.weather_code) === null
  )
    throw new Error("Invalid weather response");
  const times = Array.isArray(raw.hourly?.time) ? raw.hourly.time : [];
  return {
    time: c.time,
    temperature: c.temperature_2m!,
    apparent: numberOrNull(c.apparent_temperature),
    code: c.weather_code!,
    isDay: c.is_day === 1,
    wind: numberOrNull(c.wind_speed_10m),
    low: numberOrNull(raw.daily?.temperature_2m_min?.[0]),
    high: numberOrNull(raw.daily?.temperature_2m_max?.[0]),
    hourly: times
      .flatMap((time, i) =>
        typeof time === "string" && time >= c.time!
          ? [
              {
                time,
                temperature: numberOrNull(raw.hourly?.temperature_2m?.[i]),
                rain: numberOrNull(raw.hourly?.precipitation_probability?.[i]),
                code: numberOrNull(raw.hourly?.weather_code?.[i]),
              },
            ]
          : [],
      )
      .slice(0, 6),
  };
}
