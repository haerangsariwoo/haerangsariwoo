import "server-only";
import type { ExternalVolunteer } from "./types";
import { parseRegion } from "./region";

/**
 * VMS — 사회복지자원봉사인증관리 (한국사회복지협의회)
 *
 * 공공데이터포털 API 는 봉사활동처(기관) 목록만 제공하고 모집 공고가 없어서
 * 공개된 봉사자모집 페이지를 읽어 온다.
 *
 * 목록에는 시·도까지만 나오고 모집 기간이 없어, 상세 페이지에서
 * 모집기간·봉사지역(구/군)·활동분야를 보충한다.
 *
 * 원칙
 *  - 공개 페이지만 읽고 로그인·개인정보 영역은 건드리지 않는다
 *  - 1시간 캐시 + 페이지·동시요청 제한으로 원 사이트 부담을 최소화한다
 *  - 신청은 원문 페이지로 보내 트래픽을 되돌린다
 */
const ORIGIN = "https://www.vms.or.kr";
const LIST_URL = `${ORIGIN}/partspace/recruit.do`;
const DETAIL_BASE = `${ORIGIN}/partspace/recruitView.do`;
const UA = "Mozilla/5.0 (compatible; HaerangsariwooBot/1.0; +https://github.com/haerangsariwoo/haerang)";

/** 동시에 보낼 상세 요청 수 */
const DETAIL_CONCURRENCY = 5;

function text(html: string) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function match1(html: string, re: RegExp) {
  const m = html.match(re);
  return m ? text(m[1]) : "";
}

function toNumber(v: string): number | null {
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && /\d/.test(v) ? n : null;
}

/** "2026-08-23 ~ 2026-08-28" → ["2026-08-23", "2026-08-28"] */
function splitPeriod(v: string): [string, string] {
  const [a = "", b = ""] = v.split("~").map((s) => s.trim());
  return [a, b || a];
}

async function fetchListPage(
  page: number,
  recruitFrom: string,
  recruitTo: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const body = new URLSearchParams({
    page: String(page),
    rcritsttdte: recruitFrom,
    rcritenddte: recruitTo,
  });

  const res = await fetch(LIST_URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
      Referer: LIST_URL,
    },
    body,
  });

  if (!res.ok) throw new Error(`VMS 응답 오류 (${res.status})`);
  const html = await res.text();
  return html.match(/<li class="card">[\s\S]*?<\/li>/g) ?? [];
}

interface Detail {
  recruitStart: string;
  recruitEnd: string;
  category: string;
  area: string;
  capacity: number | null;
  applied: number | null;
}

/** 상세 페이지의 th/td 표에서 항목을 읽는다 */
async function fetchDetail(seq: string, signal?: AbortSignal): Promise<Detail | null> {
  try {
    const res = await fetch(`${DETAIL_BASE}?seq=${seq}`, {
      signal,
      headers: { "User-Agent": UA, Referer: LIST_URL },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // 템플릿 리터럴에서 \s 가 먹히지 않도록 String.raw 로 패턴을 만든다
    const cell = (label: string) =>
      match1(
        html,
        new RegExp(
          String.raw`<th[^>]*>\s*` + label + String.raw`\s*</th>\s*<td[^>]*>([\s\S]*?)</td>`,
        ),
      );

    const [recruitStart, recruitEnd] = splitPeriod(cell("모집기간"));
    // "[대구] 대구광역시 달성군" 형태 — 대괄호 축약은 떼고 전체 주소를 쓴다
    const area = cell("봉사지역").replace(/^\[[^\]]*\]\s*/, "");
    // "3명 / 0명" = 필요 / 신청
    const [need = "", applied = ""] = cell("필요/신청 인원").split("/");

    return {
      recruitStart,
      recruitEnd,
      category: cell("활동분야"),
      area,
      capacity: toNumber(need),
      applied: toNumber(applied),
    };
  } catch {
    // 상세를 못 읽어도 목록 정보만으로 표시한다
    return null;
  }
}

/** 동시 요청 수를 제한해 순차적으로 처리한다 */
async function mapLimited<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    out.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
  }
  return out;
}

export async function fetchVms(params: {
  /** 모집 마감이 이 날짜 이후인 건만 (YYYY-MM-DD) */
  recruitFrom: string;
  recruitTo?: string;
  pages?: number;
  signal?: AbortSignal;
}): Promise<ExternalVolunteer[]> {
  const pages = params.pages ?? 2;
  const to = params.recruitTo ?? `${new Date().getFullYear() + 1}-12-31`;

  const batches = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      fetchListPage(i + 1, params.recruitFrom, to, params.signal),
    ),
  );

  const base = batches.flat().map((card, i) => {
    const seq = match1(card, /recruitView\.do\?seq=(\d+)/);
    const areaChip = match1(card, /<span class="chip badge">([\s\S]*?)<\/span>/);
    const mode = match1(card, /<span class="chip badge-border">([\s\S]*?)<\/span>/);
    // 제목 끝에 "N"(새 글) 배지가 붙어 들어온다
    const title = match1(card, /<h3 class="title">([\s\S]*?)<\/h3>/).replace(/\s*N$/, "");
    const org = match1(card, /<div class="org">([\s\S]*?)<\/div>/);
    const period = match1(card, /<h5>봉사기간<\/h5>([\s\S]*?)<\/div>/);
    const counts = match1(card, /<span class="count">([\s\S]*?)<\/span>\s*<span class="state/);
    const state = match1(card, /<span class="state[^"]*">([\s\S]*?)<\/span>/);

    const [startDate, endDate] = splitPeriod(period);
    const [appliedRaw = "", capacityRaw = ""] = counts.split("/");

    return {
      seq,
      item: {
        id: `vms-${seq || i}`,
        source: "vms" as const,
        title,
        org,
        area: areaChip,
        sido: "",
        gugun: "",
        category: mode,
        startDate,
        endDate,
        recruitStart: "",
        recruitEnd: "",
        capacity: toNumber(capacityRaw),
        applied: toNumber(appliedRaw),
        closed: state.includes("마감"),
        url: seq ? `${DETAIL_BASE}?seq=${seq}` : LIST_URL,
      } satisfies ExternalVolunteer,
    };
  });

  // 상세에서 모집기간·구/군·활동분야를 보충한다
  const details = await mapLimited(base, DETAIL_CONCURRENCY, (b) =>
    b.seq ? fetchDetail(b.seq, params.signal) : Promise.resolve(null),
  );

  return base.map(({ item }, i) => {
    const d = details[i];
    const area = d?.area || item.area;
    const region = parseRegion(area, item.org);

    return {
      ...item,
      area,
      sido: region.sido,
      gugun: region.gugun,
      category: d?.category || item.category,
      recruitStart: d?.recruitStart ?? "",
      recruitEnd: d?.recruitEnd ?? "",
      capacity: d?.capacity ?? item.capacity,
      applied: d?.applied ?? item.applied,
    };
  });
}
