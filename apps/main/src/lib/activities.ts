export type ActivityType = "개강파티" | "MT" | "친목" | "총회" | "회의";
export type AttendState = "참석" | "미정" | "불참";
export type ActivityStatus = "upcoming" | "today" | "closed" | "done";
export type ActivityTone = "sky" | "mint" | "peach" | "lavender";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  dateLabel: string;
  /**
   * 목록 왼쪽 날짜 칸에 쓰는 값.
   * dateLabel 에서 뽑아 쓸 수도 있지만 그건 표기가 바뀌면 조용히 깨진다.
   * 기간 활동은 시작일만 둔다 — 전체 기간은 dateLabel 에 그대로 있다.
   */
  dateShort: string;
  weekday: string;
  timeLabel: string;
  place: string;
  target: string;
  dday: number | null;
  status: ActivityStatus;
  attend: AttendState | null;
  tone: ActivityTone;
  intro: string;
  notes: string[];
  teamPublished?: boolean;
}

export const activityTypes = ["전체", "개강파티", "MT", "친목", "총회"] as const;

export const ACTIVITY_TYPES: ActivityType[] = ["개강파티", "MT", "친목", "총회", "회의"];
export const ACTIVITY_TONES: ActivityTone[] = ["sky", "mint", "peach", "lavender"];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 관리자가 고른 날짜(YYYY-MM-DD)에서 화면에 쓰는 표기 세 가지를 만든다.
 * 표기를 손으로 적게 두면 "8.22 (금)" 인데 실제로는 목요일인 사고가 난다.
 */
export function labelsFromDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const weekday = WEEKDAYS[date.getDay()];
  const dateShort = `${m}.${String(d).padStart(2, "0")}`;
  return { dateShort, weekday, dateLabel: `${dateShort} (${weekday})` };
}

/**
 * "8.22" 같은 표기에서 남은 날짜를 센다. 연도가 없으므로 오늘에서 가장
 * 가까운 해로 본다 — 12월 활동을 1월에 열어도 지난 활동으로 읽히게.
 * 활동이 끝났는지는 status 가 정하므로 이 값은 배지 표시용이다.
 */
export function ddayFromShort(dateShort: string): number | null {
  const [m, d] = dateShort.split(".").map(Number);
  if (!m || !d) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let target = new Date(today.getFullYear(), m - 1, d);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  // 석 달 넘게 지난 날짜면 내년 같은 날을 가리킨 것으로 본다
  if (diffDays < -90) target = new Date(today.getFullYear() + 1, m - 1, d);
  else if (diffDays > 275) target = new Date(today.getFullYear() - 1, m - 1, d);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
