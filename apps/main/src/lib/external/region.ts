/** 활동 장소·기관명 문자열에서 시도와 시군구를 뽑아낸다. */

const SIDO: { key: string; label: string; aliases: string[] }[] = [
  { key: "서울", label: "서울", aliases: ["서울특별시", "서울시", "서울"] },
  { key: "경기", label: "경기", aliases: ["경기도", "경기"] },
  { key: "인천", label: "인천", aliases: ["인천광역시", "인천시", "인천"] },
  { key: "부산", label: "부산", aliases: ["부산광역시", "부산시", "부산"] },
  { key: "대구", label: "대구", aliases: ["대구광역시", "대구시", "대구"] },
  { key: "광주", label: "광주", aliases: ["광주광역시", "광주시", "광주"] },
  { key: "대전", label: "대전", aliases: ["대전광역시", "대전시", "대전"] },
  { key: "울산", label: "울산", aliases: ["울산광역시", "울산시", "울산"] },
  { key: "세종", label: "세종", aliases: ["세종특별자치시", "세종시", "세종"] },
  { key: "강원", label: "강원", aliases: ["강원특별자치도", "강원도", "강원"] },
  { key: "충북", label: "충북", aliases: ["충청북도", "충북"] },
  { key: "충남", label: "충남", aliases: ["충청남도", "충남"] },
  { key: "전북", label: "전북", aliases: ["전북특별자치도", "전라북도", "전북"] },
  { key: "전남", label: "전남", aliases: ["전라남도", "전남"] },
  { key: "경북", label: "경북", aliases: ["경상북도", "경북"] },
  { key: "경남", label: "경남", aliases: ["경상남도", "경남"] },
  { key: "제주", label: "제주", aliases: ["제주특별자치도", "제주도", "제주"] },
];

export interface ParsedRegion {
  /** 시도 (예: 서울). 못 찾으면 빈 문자열 */
  sido: string;
  /** 시군구 (예: 성북구). 못 찾으면 빈 문자열 */
  gugun: string;
}

export function parseRegion(...sources: string[]): ParsedRegion {
  const text = sources.filter(Boolean).join(" ");

  let sido = "";
  for (const s of SIDO) {
    if (s.aliases.some((a) => text.includes(a))) {
      sido = s.label;
      break;
    }
  }

  // "성북구", "청주시", "함양군" 형태를 찾는다 (시도 별칭과 겹치는 건 제외)
  let gugun = "";
  const matches = text.match(/[가-힣]{2,4}[시군구](?![가-힣])/g) ?? [];
  for (const m of matches) {
    const isSido = SIDO.some((s) => s.aliases.includes(m));
    if (!isSido) {
      gugun = m;
      break;
    }
  }

  return { sido, gugun };
}

/** 화면에 보여줄 지역 라벨 (예: "서울 성북구") */
export function regionLabel(r: ParsedRegion) {
  return [r.sido, r.gugun].filter(Boolean).join(" ");
}
