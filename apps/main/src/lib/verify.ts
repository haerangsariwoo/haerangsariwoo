/**
 * 봉사 인증 — 1365/VMS 로 참여한 봉사의 증빙(확인서·사진)을 제출하면
 * 운영진이 검토해 시간과 횟수를 반영한다. 내부봉사는 증빙이 필요 없다.
 */

export type VerifySource = "1365" | "vms";
export type VerifyState = "대기" | "승인" | "반려";

export interface ProofSubmission {
  id: string;
  source: VerifySource;
  activity_title: string;
  activity_org: string;
  activity_date: string;
  hours: number;
  photo_paths: string[];
  memo: string;
  status: VerifyState;
  reject_reason: string | null;
  created_at: string;
}
