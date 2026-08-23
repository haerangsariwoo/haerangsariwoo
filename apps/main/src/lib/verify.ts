/**
 * 봉사 인증 — 부원이 참여한 봉사의 증빙을 제출하면
 * 운영진이 검토해 실적을 업로드한다 (브리핑 8-2).
 */

export type VerifyState = "대기" | "승인" | "반려";

export interface VerifyRequest {
  id: string;
  volunteer: string;
  date: string;
  hours: number;
  proofCount: number;
  state: VerifyState;
  /** 반려 시 사유 */
  reason?: string;
}

export const verifyRequests: VerifyRequest[] = [
  {
    id: "vr1",
    volunteer: "성북천 플로깅",
    date: "2026.08.29",
    hours: 3,
    proofCount: 2,
    state: "대기",
  },
  {
    id: "vr2",
    volunteer: "여름 집중 봉사",
    date: "2026.08.05",
    hours: 8,
    proofCount: 1,
    state: "승인",
  },
  {
    id: "vr3",
    volunteer: "도서관 정리 봉사",
    date: "2026.07.04",
    hours: 2,
    proofCount: 1,
    state: "반려",
    reason: "증빙 사진에 활동 내용이 확인되지 않아요. 현장 사진을 다시 올려주세요.",
  },
];

/** 인증서를 제출할 수 있는 참여 완료 봉사 */
export const verifiableActivities = [
  { id: "va1", title: "교내 쓰레기줍기", date: "2026.09.03", hours: 2 },
  { id: "va2", title: "무료급식 배식 봉사", date: "2026.07.18", hours: 4 },
];
