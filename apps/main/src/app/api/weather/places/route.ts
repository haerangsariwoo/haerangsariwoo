import { coarseCoordinate, validCoordinates } from "@/lib/weather";

// GeoNames indexes major Korean cities primarily under their romanised names.
// Without these aliases, "부산" can return an unrelated small village first.
const CITY_ALIASES: Record<string, string> = {
  서울: "Seoul",
  부산: "Busan",
  인천: "Incheon",
  대구: "Daegu",
  대전: "Daejeon",
  광주: "Gwangju",
  울산: "Ulsan",
  세종: "Sejong",
  제주: "Jeju",
  수원: "Suwon",
  성남: "Seongnam",
  용인: "Yongin",
  고양: "Goyang",
  안양: "Anyang",
  부천: "Bucheon",
  의정부: "Uijeongbu",
  남양주: "Namyangju",
  하남: "Hanam",
  구리: "Guri",
  파주: "Paju",
  평택: "Pyeongtaek",
  화성: "Hwaseong",
  안산: "Ansan",
  시흥: "Siheung",
  김포: "Gimpo",
  춘천: "Chuncheon",
  원주: "Wonju",
  강릉: "Gangneung",
  속초: "Sokcho",
  청주: "Cheongju",
  충주: "Chungju",
  천안: "Cheonan",
  아산: "Asan",
  전주: "Jeonju",
  군산: "Gunsan",
  익산: "Iksan",
  목포: "Mokpo",
  여수: "Yeosu",
  순천: "Suncheon",
  포항: "Pohang",
  경주: "Gyeongju",
  구미: "Gumi",
  안동: "Andong",
  창원: "Changwon",
  진주: "Jinju",
  김해: "Gimhae",
  양산: "Yangsan",
  서귀포: "Seogwipo",
};

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (name.length < 2 || name.length > 60)
    return Response.json(
      { error: "도시 이름을 2~60자로 입력해 주세요." },
      { status: 400 },
    );
  const query = new URLSearchParams({
    name:
      CITY_ALIASES[
        name.replace(/(특별자치시|특별자치도|특별시|광역시|시)$/, "")
      ] ?? name,
    count: "8",
    language: "ko",
    format: "json",
    countryCode: "KR",
  });
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${query}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw new Error("Place lookup failed");
    const raw = await response.json();
    const places = (Array.isArray(raw.results) ? raw.results : [])
      .filter(
        (p: {
          latitude?: number;
          longitude?: number;
          country_code?: string;
          feature_code?: string;
        }) =>
          p.country_code === "KR" &&
          validCoordinates(p.latitude, p.longitude) &&
          /^(PPL|ADM)/.test(p.feature_code ?? ""),
      )
      .sort(
        (a: { population?: number }, b: { population?: number }) =>
          (b.population ?? 0) - (a.population ?? 0),
      )
      .map(
        (p: {
          name: string;
          admin1?: string;
          latitude: number;
          longitude: number;
        }) => ({
          label: [p.name, p.admin1 !== p.name ? p.admin1 : ""]
            .filter(Boolean)
            .join(", "),
          latitude: coarseCoordinate(p.latitude),
          longitude: coarseCoordinate(p.longitude),
        }),
      );
    return Response.json({ places });
  } catch {
    return Response.json(
      { error: "지역 검색에 연결하지 못했어요. 다시 검색해 주세요." },
      { status: 503 },
    );
  }
}
