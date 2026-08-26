import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetch1365 } from "./portal-1365";
import { fetchVms } from "./portal-vms";
import { buildSampleExternal } from "./sample";
import { normalizeServiceKey } from "./service-key";
import type { ExternalFetchResult, ExternalVolunteer } from "./types";

export type { ExternalVolunteer, ExternalFetchResult } from "./types";

/** 외부 포털 호출 결과를 1시간 캐시한다 (포털 트래픽 보호) */
const TTL_MS = 60 * 60 * 1000;

/**
 * 한쪽 포털이 빠진 결과는 짧게만 붙들고 있는다. 1시간을 그대로 두면
 * 잠깐 삐끗한 것 때문에 한 시간 내내 반쪽짜리 목록이 보인다.
 */
const TTL_PARTIAL_MS = 10 * 60 * 1000;

function ttlFor(value: ExternalFetchResult) {
  return value.error ? TTL_PARTIAL_MS : TTL_MS;
}

/**
 * 출처마다 걸리는 시간이 다르다. 1365 는 API 한 번이면 끝나지만 VMS 는
 * 공개 페이지를 목록·상세로 나눠 읽어야 해서 훨씬 오래 걸린다.
 * 예전에는 둘 다 8초로 묶어 두는 바람에 VMS 만 늘 잘려 나갔다.
 */
const TIMEOUT_1365_MS = 8000;
const TIMEOUT_VMS_MS = 14000;
/** VMS 상세 보충을 여기까지만 시도한다 — 넘기면 목록 정보로 만족한다 */
const VMS_DETAIL_BUDGET_MS = 9000;

const CACHE_KEY = "external-volunteers";

/**
 * 같은 인스턴스 안에서 짧게 다시 쓰는 자리. 진짜 캐시는 아래 표에 있다 —
 * Vercel 은 요청마다 다른 인스턴스가 처리하고 잠들면 메모리가 날아가서,
 * 메모리만 믿으면 "1시간에 한 번" 이 지켜지지 않는다.
 */
let memoryCache: { at: number; value: ExternalFetchResult } | null = null;

async function readCache(): Promise<ExternalFetchResult | null> {
  if (memoryCache && Date.now() - memoryCache.at < ttlFor(memoryCache.value)) {
    return memoryCache.value;
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("external_cache")
      .select("payload, fetched_at")
      .eq("id", CACHE_KEY)
      .maybeSingle();

    const row = data as { payload: ExternalFetchResult; fetched_at: string } | null;
    if (!row) return null;

    const at = new Date(row.fetched_at).getTime();
    if (Date.now() - at >= ttlFor(row.payload)) return null;

    memoryCache = { at, value: row.payload };
    return row.payload;
  } catch {
    // 캐시를 못 읽는 건 화면을 못 그릴 이유가 아니다 — 그냥 새로 가져온다
    return null;
  }
}

async function writeCache(value: ExternalFetchResult) {
  memoryCache = { at: Date.now(), value };
  try {
    const supabase = createAdminClient();
    await supabase
      .from("external_cache")
      .upsert({ id: CACHE_KEY, payload: value, fetched_at: new Date().toISOString() });
  } catch {
    // 저장에 실패해도 이번 요청은 이미 값을 갖고 있다
  }
}

/**
 * 왜 실패했는지 한 줄로 남긴다.
 *
 * Node 의 fetch 는 연결이 안 되면 이유를 감추고 "fetch failed" 만 던진다.
 * 진짜 이유(연결 거부·시간 초과·DNS·인증서)는 cause 에 들어 있어서, 그걸
 * 같이 적어두지 않으면 로그만 보고는 원인을 좁힐 수가 없다.
 */
function describe(reason: unknown): string {
  if (!(reason instanceof Error)) return String(reason);
  if (reason.name === "AbortError" || reason.name === "TimeoutError") {
    return "시간 초과";
  }

  // cause 가 Error 가 아닐 때도 있고 그 안에 또 cause 가 있기도 하다.
  // 무엇이 들어 있든 한 줄로 펴서 남긴다 — 놓치면 다음에 또 못 좇는다.
  const parts = [`${reason.name}: ${reason.message}`];
  let cause: unknown = (reason as Error & { cause?: unknown }).cause;

  for (let depth = 0; cause != null && depth < 4; depth++) {
    if (cause instanceof Error) {
      const e = cause as Error & { code?: string; errno?: number; syscall?: string; address?: string; port?: number };
      const detail = [e.code, e.syscall, e.address && `${e.address}:${e.port ?? ""}`]
        .filter(Boolean)
        .join(" ");
      parts.push(`${e.name}: ${e.message}${detail ? ` [${detail}]` : ""}`);
      // AggregateError 는 실패한 주소마다 하나씩 담고 있다
      const inner = (e as AggregateError).errors;
      if (Array.isArray(inner)) {
        parts.push(...inner.slice(0, 3).map((x) => (x instanceof Error ? `${x.name}: ${x.message}` : String(x))));
      }
      cause = (e as Error & { cause?: unknown }).cause;
    } else {
      parts.push(String(cause));
      cause = null;
    }
  }

  // 어느 리전에서 난 실패인지도 같이 남긴다
  const region = process.env.VERCEL_REGION;
  return parts.join(" ← ") + (region ? ` @${region}` : "");
}

function withinDeadline<T>(ms: number, p: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
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
  if (!options?.force) {
    const cached = await readCache();
    if (cached) return cached;
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
    await writeCache(value);
    return value;
  }

  // VMS 는 공개 모집 목록을 읽어 온다 (공공데이터포털 API 에는 모집 공고가 없다)
  const vmsDisabled = process.env.DISABLE_VMS === "1";
  const today = new Date().toISOString().slice(0, 10);

  const tasks: { source: string; run: Promise<ExternalVolunteer[]> }[] = [];
  if (serviceKey) {
    const key = serviceKey;
    tasks.push({
      source: "1365",
      run: withinDeadline(TIMEOUT_1365_MS, (signal) =>
        fetch1365({ serviceKey: key, pages: 5, signal }),
      ),
    });
  }
  if (!vmsDisabled) {
    tasks.push({
      source: "VMS",
      run: withinDeadline(TIMEOUT_VMS_MS, (signal) =>
        fetchVms({
          recruitFrom: today,
          pages: 3,
          signal,
          detailDeadlineAt: Date.now() + VMS_DETAIL_BUDGET_MS,
        }),
      ),
    });
  }

  const results = await Promise.allSettled(tasks.map((t) => t.run));

  const items: ExternalVolunteer[] = [];
  const errors: string[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      items.push(...r.value);
      return;
    }
    // 어느 포털이 왜 빠졌는지 알아야 화면에서 안내하고 원인도 좇을 수 있다
    errors.push(`${tasks[i].source}: ${describe(r.reason)}`);
  });

  // 둘 다 실패하면 예시 데이터로 화면을 유지한다
  if (items.length === 0) {
    const value: ExternalFetchResult = {
      items: normalize(buildSampleExternal()),
      live: false,
      error: errors.join(" / ") || "외부 포털에서 가져온 결과가 없습니다.",
      fetchedAt: new Date().toISOString(),
    };
    await writeCache(value);
    return value;
  }

  const value: ExternalFetchResult = {
    items: normalize(items),
    live: true,
    error: errors.length ? errors.join(" / ") : undefined,
    fetchedAt: new Date().toISOString(),
  };
  await writeCache(value);
  return value;
}
