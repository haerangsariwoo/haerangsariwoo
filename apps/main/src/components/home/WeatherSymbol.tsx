import { weatherCondition } from "@/lib/weather";

export function WeatherSymbol({
  code,
  isDay = true,
}: {
  code: number;
  isDay?: boolean;
}) {
  const kind = weatherCondition(code).icon;
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "clear" ? (
        isDay ? (
          <>
            <circle cx="32" cy="32" r="12" fill="currentColor" opacity=".18" />
            <circle cx="32" cy="32" r="12" />
            <path d="M32 5v7m0 40v7M5 32h7m40 0h7M13 13l5 5m28 28 5 5M13 51l5-5m28-28 5-5" />
          </>
        ) : (
          <path
            d="M46 43A23 23 0 0 1 22 12a23 23 0 1 0 30 30Z"
            fill="currentColor"
            fillOpacity=".18"
          />
        )
      ) : (
        <>
          <path
            d="M17 43a11 11 0 1 1 2-22 16 16 0 0 1 30 6 8 8 0 1 1 0 16Z"
            fill="currentColor"
            fillOpacity=".16"
          />
          {kind === "rain" && <path d="m22 50-3 6m14-6-3 6m14-6-3 6" />}
          {kind === "storm" && <path d="m33 43-7 10h10l-6 9" />}
          {kind === "fog" && <path d="M15 51h35M21 58h24" />}
          {kind === "snow" && (
            <>
              <path d="M21 50v10m-4-7 8 4m0-4-8 4M42 50v10m-4-7 8 4m0-4-8 4" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
