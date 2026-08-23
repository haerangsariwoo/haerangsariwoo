import "server-only";
import type { ExternalVolunteer } from "./types";

/**
 * VMS — 한국사회복지협의회 봉사활동정보 조회
 * 공공데이터포털: https://www.data.go.kr/data/15077681/openapi.do
 *
 * 서비스 URL: https://apis.data.go.kr/B460014/vmsdataview
 * 모집정보 오퍼레이션 경로는 승인 후 문서에서 확인해 환경변수로 지정한다.
 */
const BASE = "https://apis.data.go.kr/B460014/vmsdataview";
const DEFAULT_OPERATION = process.env.VMS_RECRUIT_OPERATION ?? "getVltrRcritList";

function pick(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim();
}

function toDate(v: string) {
  if (/^\d{8}$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  return v;
}

function toNumber(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" ? n : null;
}

export async function fetchVms(params: {
  serviceKey: string;
  numOfRows?: number;
  signal?: AbortSignal;
}): Promise<ExternalVolunteer[]> {
  const qs = new URLSearchParams({
    serviceKey: params.serviceKey,
    numOfRows: String(params.numOfRows ?? 30),
    pageNo: "1",
  });

  const res = await fetch(`${BASE}/${DEFAULT_OPERATION}?${qs.toString()}`, {
    signal: params.signal,
    headers: { Accept: "application/xml" },
  });

  if (!res.ok) {
    throw new Error(`VMS 응답 오류 (${res.status})`);
  }

  const xml = await res.text();

  const resultCode = pick(xml, "resultCode");
  if (resultCode && !["00", "0"].includes(resultCode)) {
    throw new Error(`VMS 오류: ${pick(xml, "resultMsg") || resultCode}`);
  }

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items.map((raw, i) => {
    // VMS는 문서상 필드명이 기관/모집 정보가 섞여 있어 후보를 순서대로 확인한다
    const id = pick(raw, "rcritNo") || pick(raw, "centCode") || String(i);
    return {
      id: `vms-${id}`,
      source: "vms" as const,
      title: pick(raw, "rcritNm") || pick(raw, "progrmSj") || pick(raw, "centName"),
      org: pick(raw, "centName") || pick(raw, "mnnstNm"),
      area: pick(raw, "areaName") || pick(raw, "sidoNm"),
      category: pick(raw, "fldName") || pick(raw, "srvcClNm"),
      startDate: toDate(pick(raw, "actBgnDe") || pick(raw, "progrmBgnde")),
      endDate: toDate(pick(raw, "actEndDe") || pick(raw, "progrmEndde")),
      capacity: toNumber(pick(raw, "rcritNmpr")),
      applied: toNumber(pick(raw, "appTotal")),
      url: "https://www.vms.or.kr",
    };
  });
}
