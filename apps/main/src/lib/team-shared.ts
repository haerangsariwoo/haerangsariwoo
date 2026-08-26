/**
 * 팀짜기 화면(클라이언트)과 서버 조회가 같이 쓰는 값들.
 * lib/teams.ts 는 서버 전용이라 여기서 갈라 둔다.
 */

/** 팀짜기 판에 올라가는 한 사람. 성별은 성비 균등 자동 편성에 쓴다 */
export interface TeamMemberRow {
  id: string;
  name: string;
  cohort: string;
  gender: "남" | "여" | "미정";
}

/** 조 번호 → 그 조의 조장 member_id. 아직 안 정한 조는 값이 없다 */
export type TeamLeaders = Record<number, string>;

/** 회원 정보에 성별이 없을 수도 있다 — 그때는 따로 묶어 고르게 나눈다 */
export function toTeamGender(v: string | null | undefined): TeamMemberRow["gender"] {
  return v === "남" || v === "여" ? v : "미정";
}
