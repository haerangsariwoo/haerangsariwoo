/**
 * 지원자 · 면접 슬롯 타입. 실제 데이터는 applicants / interview_slots
 * 테이블에서 온다 (apps/recruit/src/lib/supabase 의 클라이언트로 조회).
 */

export type FirstResult = "대기" | "합격" | "불합격";
export type FinalResult = "대기" | "합격" | "불합격";

export interface Applicant {
  id: string;
  student_id: string;
  name: string;
  track: string;
  phone: string;
  motivation: string;
  applied_at: string;
  first_result: FirstResult;
  /** 운영진이 배정한 면접 시간 라벨. 예: "9.11 (목) 14:00" */
  interview: string | null;
  final_result: FinalResult;
}

export interface SlotRow {
  id: string;
  slot_date: string;
  time_range: string;
  interval_label: string;
  capacity: number;
}
