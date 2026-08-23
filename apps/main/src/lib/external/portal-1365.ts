import "server-only";
import type { ExternalVolunteer } from "./types";

/**
 * 1365 자원봉사포털 — 행정안전부 봉사참여정보서비스
 * 공공데이터포털: https://www.data.go.kr/data/15000221/openapi.do
 *
 * 크롤링이 아니라 공식 OpenAPI를 사용한다.
 * 신청 키는 DATA_GO_KR_SERVICE_KEY 환경변수로 주입한다.
 */
const ENDPOINT =
  "http://openapi.1365.go.kr/openapi/service/rest/VolunteerPartcptnService/getVltrPartcptnItem";

/** 상세 페이지 링크 — progrmRegistNo(프로그램 등록번호) 기준 */
function detailUrl(progrmRegistNo: string) {
  return `https://www.1365.go.kr/vols/1572247904127/partcptn/timeCptn.do?type=show&progrmRegistNo=${progrmRegistNo}`;
}

/** XML 한 덩어리에서 태그 값을 뽑는다 (의존성 없이 처리) */
function pick(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim();
}

/** YYYYMMDD → YYYY-MM-DD */
function toDate(v: string) {
  if (!/^\d{8}$/.test(v)) return v;
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

function toNumber(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" ? n : null;
}

export async function fetch1365(params: {
  serviceKey: string;
  numOfRows?: number;
  /** 활동 시작일 이후만 (YYYYMMDD) */
  from?: string;
  signal?: AbortSignal;
}): Promise<ExternalVolunteer[]> {
  const qs = new URLSearchParams({
    serviceKey: params.serviceKey,
    numOfRows: String(params.numOfRows ?? 30),
    pageNo: "1",
  });
  if (params.from) qs.set("schSdate", params.from);

  const res = await fetch(`${ENDPOINT}?${qs.toString()}`, {
    signal: params.signal,
    headers: { Accept: "application/xml" },
  });

  if (!res.ok) {
    throw new Error(`1365 응답 오류 (${res.status})`);
  }

  const xml = await res.text();

  // 공공데이터포털은 오류도 200으로 내려주는 경우가 있어 본문을 확인한다
  const resultCode = pick(xml, "resultCode");
  if (resultCode && resultCode !== "00") {
    throw new Error(`1365 오류: ${pick(xml, "resultMsg") || resultCode}`);
  }

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items.map((raw) => {
    const no = pick(raw, "progrmRegistNo");
    return {
      id: `1365-${no}`,
      source: "1365" as const,
      title: pick(raw, "progrmSj"),
      org: pick(raw, "nanmmbyNm") || pick(raw, "mnnstNm"),
      area: [pick(raw, "sidoCd"), pick(raw, "gugunCd")].filter(Boolean).join(" "),
      category: pick(raw, "srvcClCode"),
      startDate: toDate(pick(raw, "progrmBgnde")),
      endDate: toDate(pick(raw, "progrmEndde")),
      capacity: toNumber(pick(raw, "rcritNmpr")),
      applied: toNumber(pick(raw, "appTotal")),
      url: detailUrl(no),
    };
  });
}
