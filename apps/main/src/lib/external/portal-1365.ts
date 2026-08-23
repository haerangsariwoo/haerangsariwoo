import "server-only";
import type { ExternalVolunteer } from "./types";
import { parseRegion } from "./region";

/**
 * 1365 자원봉사포털 — 행정안전부 봉사참여정보서비스
 * 공공데이터포털: https://www.data.go.kr/data/15000221/openapi.do
 *
 * 크롤링이 아니라 공식 OpenAPI를 사용한다.
 * 목록 조회는 getVltrSearchWordList 오퍼레이션이 담당한다.
 * (getVltrPartcptnItem 은 상세 조회용이라 목록이 비어 있다)
 */
const BASE =
  "http://openapi.1365.go.kr/openapi/service/rest/VolunteerPartcptnService";
const LIST_OPERATION = process.env.PORTAL_1365_OPERATION ?? "getVltrSearchWordList";

function pick(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim();
}

/** XML 엔티티 복원 (url 에 &amp; 가 들어온다) */
function unescape(v: string) {
  return v
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** YYYYMMDD → YYYY-MM-DD */
function toDate(v: string) {
  if (!/^\d{8}$/.test(v)) return v;
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

async function fetchPage(
  serviceKey: string,
  pageNo: number,
  numOfRows: number,
  signal?: AbortSignal,
): Promise<string[]> {
  const qs = new URLSearchParams({
    serviceKey,
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
  });

  const res = await fetch(`${BASE}/${LIST_OPERATION}?${qs.toString()}`, {
    signal,
    headers: { Accept: "application/xml" },
  });

  if (!res.ok) throw new Error(`1365 응답 오류 (${res.status})`);

  const xml = await res.text();

  // 공공데이터포털은 오류도 200으로 내려주므로 본문을 확인한다
  const resultCode = pick(xml, "resultCode");
  if (resultCode && resultCode !== "00") {
    throw new Error(`1365 오류: ${pick(xml, "resultMsg") || resultCode}`);
  }

  return xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
}

export async function fetch1365(params: {
  serviceKey: string;
  /** 한 번에 가져올 페이지 수 (지역 필터를 위해 넉넉히 받는다) */
  pages?: number;
  numOfRows?: number;
  signal?: AbortSignal;
}): Promise<ExternalVolunteer[]> {
  const pages = params.pages ?? 3;
  const numOfRows = params.numOfRows ?? 100;

  const batches = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      fetchPage(params.serviceKey, i + 1, numOfRows, params.signal),
    ),
  );
  const items = batches.flat();

  return items.map((raw) => {
    const no = pick(raw, "progrmRegistNo");
    const begin = pick(raw, "actBeginTm");
    const end = pick(raw, "actEndTm");
    const time = begin && end ? `${begin}:00–${end}:00` : "";
    const place = pick(raw, "actPlace");
    const org = pick(raw, "nanmmbyNm");
    const region = parseRegion(place, org);

    return {
      id: `1365-${no}`,
      source: "1365" as const,
      title: pick(raw, "progrmSj"),
      org,
      // sidoCd·gugunCd 는 코드값이라 표시에 부적합해 실제 활동 장소를 쓴다
      area: place,
      sido: region.sido,
      gugun: region.gugun,
      category: pick(raw, "srvcClCode"),
      startDate: toDate(pick(raw, "progrmBgnde")),
      endDate: toDate(pick(raw, "progrmEndde")),
      // noticeBgnde/noticeEndde 가 실제 신청 가능한 모집 기간이다
      recruitStart: toDate(pick(raw, "noticeBgnde")),
      recruitEnd: toDate(pick(raw, "noticeEndde")),
      // 이 오퍼레이션은 모집 인원을 제공하지 않는다
      capacity: null,
      applied: null,
      time,
      // 응답에 상세 링크가 포함되어 있다
      url: unescape(pick(raw, "url")) || `https://www.1365.go.kr`,
    };
  });
}
