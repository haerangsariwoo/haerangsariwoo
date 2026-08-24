import "server-only";
import { fetch1365 } from "./portal-1365";
import { fetchVms } from "./portal-vms";
import { buildSampleExternal } from "./sample";
import { normalizeServiceKey } from "./service-key";
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

/**
 * 아직 신청할 수 있는 모집만 남긴다.
 * 오늘 마감인 건은 사실상 신청이 어려우므로 내일 이후까지 열린 것만 통과시킨다.
 * 모집 기간을 알 수 없으면 활동 종료일로 대신 판단한다.
 */
function isStillOpen(v: ExternalVolunteer, tomorrow: string) {
  // 출처가 마감을 명시하면 그대로 따른다 (VMS)
  if (v.closed) return false;
  if (v.recruitEnd) return v.recruitEnd >= tomorrow;
  if (v.endDate) return v.endDate >= tomorrow;
  return true;
}

/** 신청 가능한 건만 남기고, 모집 마감이 임박한 순으로 정렬한다 */
function normalize(items: ExternalVolunteer[]) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const tomorrow = t.toISOString().slice(0, 10);

  return items
    .filter((v) => v.title && isStillOpen(v, tomorrow))
    .sort((a, b) => (a.recruitEnd || a.startDate).localeCompare(b.recruitEnd || b.startDate));
}

export async function getExternalVolunteers(options?: {
  force?: boolean;
}): Promise<ExternalFetchResult> {
  if (!options?.force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.value;
  }

  // Encoding/Decoding 어느 키를 넣어도 동작하도록 정규화한다
  const serviceKey = normalizeServiceKey(process.env.DATA_GO_KR_SERVICE_KEY);

  // 1365 키가 없어도 VMS 는 동작하므로 둘 다 불가능할 때만 예시로 대체한다
  if (!serviceKey && process.env.DISABLE_VMS === "1") {
    const value: ExternalFetchResult = {
      items: normalize(buildSampleExternal()),
      live: false,
      error: "DATA_GO_KR_SERVICE_KEY 가 설정되지 않아 예시 데이터를 표시합니다.",
      fetchedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), value };
    return value;
  }

  // VMS 는 공개 모집 목록을 읽어 온다 (공공데이터포털 API 에는 모집 공고가 없다)
  const vmsDisabled = process.env.DISABLE_VMS === "1";
  const today = new Date().toISOString().slice(0, 10);

  const tasks: Promise<ExternalVolunteer[]>[] = [];
  if (serviceKey) {
    const key = serviceKey;
    tasks.push(withinDeadline((signal) => fetch1365({ serviceKey: key, pages: 5, signal })));
  }
  if (!vmsDisabled) {
    tasks.push(withinDeadline((signal) => fetchVms({ recruitFrom: today, pages: 3, signal })));
  }

  const results = await Promise.allSettled(tasks);

  const items: ExternalVolunteer[] = [];
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
  }

  // 둘 다 실패하면 예시 데이터로 화면을 유지한다
  if (items.length === 0) {
    const value: ExternalFetchResult = {
      items: normalize(buildSampleExternal()),
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
