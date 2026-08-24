import type { ExternalVolunteer } from "./types";

/**
 * API 키가 없거나 외부 포털 호출이 실패했을 때 보여줄 예시 데이터.
 * 실제 응답과 같은 형태라 화면 검증에 그대로 쓸 수 있다.
 *
 * 날짜는 부를 때마다 그날 기준으로 다시 만든다. 고정 날짜로 적어두면 그 날이
 * 지나는 순간 normalize() 의 마감 필터에 전부 걸려 목록이 통째로 비어버린다.
 * 모듈을 읽을 때 한 번만 계산해도 같은 일이 생긴다 — 서버가 며칠 켜져 있으면
 * 그 값이 그대로 굳는다. 예시 데이터는 언제 열어도 보여야 한다.
 */

interface Seed {
  source: "1365" | "vms";
  title: string;
  org: string;
  gugun: string;
  category: string;
  capacity: number;
  applied: number;
  /** 활동이 여러 날 이어지는 경우의 기간(일) */
  span?: number;
  time?: string;
}

/** 한성대 부원이 실제로 지원할 만한 서울 동북권 위주 */
const SEEDS: Seed[] = [
  { source: "1365", title: "무료급식소 배식 봉사", org: "성북종합사회복지관", gugun: "성북구", category: "복지", capacity: 20, applied: 14, time: "10:00 – 13:00" },
  { source: "vms", title: "유기견 보호소 환경 정비", org: "성북 동물보호센터", gugun: "성북구", category: "환경", capacity: 12, applied: 12 },
  { source: "1365", title: "지역아동센터 학습 멘토링", org: "성북구 자원봉사센터", gugun: "성북구", category: "교육", capacity: 12, applied: 5, span: 90, time: "16:00 – 18:00" },
  { source: "vms", title: "독거어르신 안부 확인", org: "한국사회복지협의회", gugun: "강북구", category: "복지", capacity: 8, applied: 3, span: 70 },
  { source: "1365", title: "성북천 환경 정화 활동", org: "성북구청 환경과", gugun: "성북구", category: "환경", capacity: 40, applied: 22, time: "09:00 – 12:00" },
  { source: "1365", title: "장애인 나들이 동행", org: "동대문장애인복지관", gugun: "동대문구", category: "복지", capacity: 10, applied: 7 },
  { source: "vms", title: "푸드뱅크 물품 분류", org: "서울광역푸드뱅크", gugun: "중랑구", category: "복지", capacity: 15, applied: 9, time: "13:00 – 17:00" },
  { source: "1365", title: "어린이 도서관 책 정리", org: "노원어린이도서관", gugun: "노원구", category: "문화", capacity: 8, applied: 8 },
  { source: "vms", title: "요양원 말벗 봉사", org: "강북실버케어센터", gugun: "강북구", category: "복지", capacity: 6, applied: 2, span: 120 },
  { source: "1365", title: "다문화가정 한국어 교실 보조", org: "성북글로벌빌리지센터", gugun: "성북구", category: "교육", capacity: 10, applied: 4, span: 60, time: "19:00 – 21:00" },
  { source: "1365", title: "북한산 둘레길 정화 활동", org: "국립공원공단", gugun: "강북구", category: "환경", capacity: 30, applied: 11 },
  { source: "vms", title: "장애아동 통합 캠프 보조", org: "서울시립아동복지센터", gugun: "종로구", category: "복지", capacity: 20, applied: 16, span: 2 },
  { source: "1365", title: "청소년 진로 멘토링", org: "동대문청소년수련관", gugun: "동대문구", category: "교육", capacity: 12, applied: 6, span: 45 },
  { source: "vms", title: "무료 진료소 접수 안내", org: "성북구보건소", gugun: "성북구", category: "보건", capacity: 6, applied: 1, time: "09:30 – 12:30" },
  { source: "1365", title: "김장 나눔 봉사", org: "성북구 자원봉사센터", gugun: "성북구", category: "복지", capacity: 50, applied: 31 },
  { source: "1365", title: "지역 벽화 그리기", org: "삼선동 주민센터", gugun: "성북구", category: "문화", capacity: 16, applied: 10, span: 3 },
  { source: "vms", title: "시각장애인 도서 녹음", org: "한국점자도서관", gugun: "강북구", category: "문화", capacity: 10, applied: 4, span: 150 },
  { source: "1365", title: "노인복지관 급식 보조", org: "노원노인종합복지관", gugun: "노원구", category: "복지", capacity: 12, applied: 12, time: "11:00 – 14:00" },
  { source: "vms", title: "아동 그룹홈 학습 지도", org: "중랑아동그룹홈", gugun: "중랑구", category: "교육", capacity: 8, applied: 3, span: 100 },
  { source: "1365", title: "재활용 분리배출 캠페인", org: "동대문구청", gugun: "동대문구", category: "환경", capacity: 25, applied: 13 },
  { source: "1365", title: "헌혈 캠페인 안내 도우미", org: "대한적십자사 서울혈액원", gugun: "종로구", category: "보건", capacity: 10, applied: 5, span: 2 },
  { source: "vms", title: "장애인 복지관 행사 진행 보조", org: "노원장애인복지관", gugun: "노원구", category: "복지", capacity: 14, applied: 8 },
  { source: "1365", title: "취약계층 도시락 배달", org: "성북나눔의집", gugun: "성북구", category: "복지", capacity: 18, applied: 9, span: 30, time: "17:00 – 19:00" },
  { source: "vms", title: "지역 어린이 안전 교육 보조", org: "서울시민안전체험관", gugun: "광진구", category: "교육", capacity: 12, applied: 6 },
  { source: "1365", title: "유기묘 임시보호 홍보 부스", org: "동물자유연대", gugun: "마포구", category: "환경", capacity: 8, applied: 7, span: 2 },
  { source: "vms", title: "청각장애인 수어 통역 보조", org: "서울농아인협회", gugun: "종로구", category: "복지", capacity: 6, applied: 2, span: 80 },
];

const DAY = 86_400_000;

/** 오늘로부터 n일 뒤를 YYYY-MM-DD 로 */
function iso(daysFromToday: number) {
  return new Date(Date.now() + daysFromToday * DAY).toISOString().slice(0, 10);
}

export function buildSampleExternal(): ExternalVolunteer[] {
  return SEEDS.map((s, i) => {
    // 마감이 가까운 것부터 두 달 뒤까지 고르게 퍼뜨린다
    const recruitEndIn = 2 + i * 2;
    const startIn = recruitEndIn + 3;

    return {
      id: `${s.source}-sample-${i + 1}`,
      source: s.source,
      title: s.title,
      org: s.org,
      area: `서울 ${s.gugun}`,
      sido: "서울",
      gugun: s.gugun,
      category: s.category,
      recruitStart: iso(recruitEndIn - 14),
      recruitEnd: iso(recruitEndIn),
      startDate: iso(startIn),
      endDate: iso(startIn + (s.span ?? 0)),
      capacity: s.capacity,
      applied: s.applied,
      time: s.time,
      url: s.source === "1365" ? "https://www.1365.go.kr" : "https://www.vms.or.kr",
    };
  });
}
