/** 외부 포털(1365 · VMS)에서 가져온 봉사 모집 정보 */
export interface ExternalVolunteer {
  /** 출처를 포함한 고유 id (예: "1365-2024123456") */
  id: string;
  source: "1365" | "vms";
  title: string;
  /** 모집 기관 / 활동처 */
  org: string;
  /** 활동 장소 원문 */
  area: string;
  /** 시도 (예: 서울) — 필터용 */
  sido: string;
  /** 시군구 (예: 성북구) — 필터용 */
  gugun: string;
  /** 활동 분야 (환경, 교육 등) */
  category: string;
  /** 활동 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 활동 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 모집 인원 (알 수 없으면 null) */
  capacity: number | null;
  /** 신청 인원 (알 수 없으면 null) */
  applied: number | null;
  /** 활동 시간대 (예: 10:00–12:00) */
  time?: string;
  /** 원본 사이트 상세 링크 */
  url: string;
}

export interface ExternalFetchResult {
  items: ExternalVolunteer[];
  /** 실제 외부 API를 호출했는지 (false면 예시 데이터) */
  live: boolean;
  /** 호출 실패 시 사유 */
  error?: string;
  fetchedAt: string;
}
