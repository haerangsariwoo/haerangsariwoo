"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  coarseCoordinate,
  SEOUL,
  weatherCondition,
  type WeatherData,
  type WeatherLocation,
} from "@/lib/weather";
import { WeatherSymbol } from "./WeatherSymbol";
import styles from "./WeatherCard.module.css";

const degrees = (v: number | null) => (v === null ? "—" : `${Math.round(v)}°`);

export function WeatherCard({ volunteerPlace }: { volunteerPlace?: string }) {
  const [location, setLocation] = useState<WeatherLocation>(SEOUL);
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("");
  const [choose, setChoose] = useState(false);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState("");
  const searchRequest = useRef<AbortController | null>(null);
  const locationRequest = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => {
      setBusy(true);
      setData(null);
      setError("");
      fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          return result as WeatherData;
        })
        .then((result) => {
          if (!controller.signal.aborted) setData(result);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              "날씨를 불러오지 못했어요. 연결을 확인하고 다시 눌러주세요.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    });
    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [location, refresh]);
  useEffect(
    () => () => {
      searchRequest.current?.abort();
      locationRequest.current++;
    },
    [],
  );

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationNote(
        "이 브라우저는 위치를 지원하지 않아요. 봉사 지역을 직접 골라주세요.",
      );
      return;
    }
    const id = ++locationRequest.current;
    setLocating(true);
    setLocationNote("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (id !== locationRequest.current) return;
        setLocation({
          label: "내 위치 주변",
          latitude: coarseCoordinate(position.coords.latitude),
          longitude: coarseCoordinate(position.coords.longitude),
        });
        setLocating(false);
        setChoose(false);
      },
      (failure) => {
        if (id !== locationRequest.current) return;
        setLocating(false);
        setLocationNote(
          failure.code === 1
            ? "위치 권한이 꺼져 있어요. 봉사 지역을 직접 고르거나 브라우저에서 위치를 허용해 주세요."
            : "현재 위치를 찾지 못했어요. 봉사 지역을 직접 골라주세요.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setSearching(true);
    setPlaces([]);
    setSearchNote("");
    try {
      const response = await fetch(
        `/api/weather/places?q=${encodeURIComponent(query.trim())}`,
        { signal: controller.signal },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (controller.signal.aborted) return;
      setPlaces(result.places);
      if (!result.places.length)
        setSearchNote(
          "찾은 지역이 없어요. 건물명 대신 도시 이름(예: 서울, 수원)을 입력해 주세요.",
        );
    } catch {
      if (!controller.signal.aborted)
        setSearchNote(
          "지역을 검색하지 못했어요. 연결을 확인하고 다시 검색해 주세요.",
        );
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  return (
    <section className={styles.card} aria-label="현재 날씨" data-weather-card>
      <div className={styles.top}>
        <h1>{location.label} 날씨</h1>
        <div className={styles.topActions}>
          <a
            className={styles.sourceLink}
            href="https://open-meteo.com/en/licence"
            target="_blank"
            rel="noreferrer"
            aria-label="날씨 출처 및 이용 안내: Open-Meteo / GeoNames (새 탭)"
            title="Open-Meteo 날씨 / GeoNames 지역 데이터 및 이용 안내"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 11v5m0-8v.01" />
            </svg>
          </a>
        <button
          type="button"
          onClick={() => setRefresh((n) => n + 1)}
          disabled={busy}
          aria-label="날씨 새로고침"
          className={styles.refresh}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M20 7v5h-5M4 17v-5h5M19 11a7 7 0 0 0-12-5M5 13a7 7 0 0 0 12 5" />
          </svg>
        </button>
        </div>
      </div>
      <div aria-live="polite" aria-busy={busy} className={styles.weather}>
        {busy ? (
          <p className={styles.loading}>지금 날씨를 확인하고 있어요.</p>
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button type="button" onClick={() => setRefresh((n) => n + 1)}>
              다시 불러오기
            </button>
          </div>
        ) : (
          data && (
            <>
              <div className={styles.now}>
                <div>
                  <strong className={styles.temperature}>
                    {degrees(data.temperature)}
                  </strong>
                  <span className={styles.condition}>
                    {weatherCondition(data.code).label}
                  </span>
                  <p className={styles.range}>
                    최고 {degrees(data.high)} / 최저 {degrees(data.low)}
                  </p>
                </div>
                <div className={styles.symbol}>
                  <WeatherSymbol code={data.code} isDay={data.isDay} />
                </div>
              </div>
              <dl className={styles.metrics}>
                <div>
                  <dt>체감</dt>
                  <dd>{degrees(data.apparent)}</dd>
                </div>
                <div>
                  <dt>바람</dt>
                  <dd>
                    {data.wind === null ? "—" : `${data.wind.toFixed(1)}m/s`}
                  </dd>
                </div>
              </dl>
              <div className={styles.hourly} aria-label="앞으로 6시간 예보">
                {data.hourly.map((hour) => (
                  <div key={hour.time}>
                    <span>
                      {hour.time.slice(0, 10) !== data.time.slice(0, 10)
                        ? "내일 "
                        : ""}
                      {hour.time.slice(11, 13)}시
                    </span>
                    <strong>{degrees(hour.temperature)}</strong>
                    <small>
                      비 {hour.rain === null ? "—" : `${hour.rain}%`}
                    </small>
                  </div>
                ))}
              </div>
              <p className={styles.updated}>
                {data.time.slice(5, 10).replace("-", ".")}{" "}
                {data.time.slice(11, 16)} 기준 (한국 시간)
              </p>
            </>
          )
        )}
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={useCurrentLocation} disabled={locating}>
          {locating ? "위치 확인 중" : "내 위치 날씨"}
        </button>
        <button
          type="button"
          aria-expanded={choose}
          aria-controls="weather-places"
          onClick={() => setChoose(!choose)}
        >
          봉사 지역 선택
        </button>
      </div>
      {locationNote && (
        <p className={styles.note} role="status">
          {locationNote}
        </p>
      )}
      {choose && (
        <div id="weather-places" className={styles.choose}>
          {volunteerPlace && (
            <p className={styles.note}>
              다가오는 활동 장소: {volunteerPlace}. 해당 도시를 검색해 주세요.
            </p>
          )}
          <form onSubmit={search}>
            <label htmlFor="weather-city">봉사할 도시</label>
            <div className={styles.search}>
              <input
                id="weather-city"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 서울, 부산, 수원"
                minLength={2}
                maxLength={60}
                required
              />
              <button disabled={searching || query.trim().length < 2}>
                {searching ? "검색 중" : "검색"}
              </button>
            </div>
          </form>
          <p className={styles.note}>
            도시 기준 날씨예요. 세부 주소의 날씨와 다를 수 있어요.
          </p>
          {searchNote && (
            <p role="status" className={styles.note}>
              {searchNote}
            </p>
          )}
          <ul className={styles.results}>
            {places.map((place, i) => (
              <li key={`${place.latitude}-${place.longitude}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    locationRequest.current++;
                    setLocating(false);
                    setLocation(place);
                    setChoose(false);
                    setLocationNote("");
                  }}
                >
                  {place.label}
                  <span>선택</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
