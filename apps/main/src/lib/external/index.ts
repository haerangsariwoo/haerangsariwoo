import "server-only";
import { fetch1365 } from "./portal-1365";
import { fetchVms } from "./portal-vms";
import { sampleExternal } from "./sample";
import type { ExternalFetchResult, ExternalVolunteer } from "./types";

export type { ExternalVolunteer, ExternalFetchResult } from "./types";

/** 외부 포털 호출 결과를 1시간 캐시한다 (포털 트래픽 보호) */
const TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

let cache: { at: number; value: ExternalFetchResult } | null = null;

function withinDeadline<T>(p: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  return p(ac.signal).finally(() => clearTimeout(timer));
}

/** 활동이 이미 끝난 건 제외하고, 시작일 빠른 순으로 */
function normalize(items: ExternalVolunteer[]) {
  const today = new Date().toISOString().slice(0, 10);
  return items
    .filter((v) => v.title && (!v.endDate || v.endDate >= today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getExternalVolunteers(options?: {
  force?: boolean;
}): Promise<ExternalFetchResult> {
  if (!options?.force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.value;
  }

  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

  // 키가 없으면 예시 데이터로 동작한다 (팀원이 키 없이도 화면을 볼 수 있게)
  if (!serviceKey) {
    const value: ExternalFetchResult = {
      items: normalize(sampleExternal),
      live: false,
      error: "DATA_GO_KR_SERVICE_KEY 가 설정되지 않아 예시 데이터를 표시합니다.",
      fetchedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), value };
    return value;
  }

  const results = await Promise.allSettled([
    withinDeadline((signal) => fetch1365({ serviceKey, signal })),
    withinDeadline((signal) => fetchVms({ serviceKey, signal })),
  ]);

  const items: ExternalVolunteer[] = [];
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
  }

  // 둘 다 실패하면 예시 데이터로 화면을 유지한다
  if (items.length === 0) {
    const value: ExternalFetchResult = {
      items: normalize(sampleExternal),
      live: false,
      error: errors.join(" / ") || "외부 포털에서 가져온 결과가 없습니다.",
      fetchedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), value };
    return value;
  }

  const value: ExternalFetchResult = {
    items: normalize(items),
    live: true,
    error: errors.length ? errors.join(" / ") : undefined,
    fetchedAt: new Date().toISOString(),
  };
  cache = { at: Date.now(), value };
  return value;
}
