export interface Profile {
  name: string;
  studentId: string;
  cohort: string;
  track: string;
  role: "부원" | "운영진";
}

export const profile: Profile = {
  name: "홍근",
  studentId: "2591001",
  cohort: "59기",
  track: "IT공과대 · 컴퓨터공학",
  role: "부원",
};

export interface HourStat {
  label: string;
  value: string;
  caption: string;
}

export const hourStats: HourStat[] = [
  { label: "누적 봉사시간", value: "76", caption: "시간" },
  { label: "이번 학기", value: "18", caption: "/ 20시간" },
  { label: "출석률", value: "92", caption: "%" },
];

export type RecordState = "참여확정" | "신청완료" | "대기" | "활동완료" | "취소" | "불참";

export interface ActivityRecord {
  id: string;
  title: string;
  date: string;
  hours: number | null;
  state: RecordState;
}

export const records: ActivityRecord[] = [
  { id: "r1", title: "아동센터 교육 봉사", date: "2026.08.22", hours: null, state: "참여확정" },
  { id: "r2", title: "한강 플로깅", date: "2026.08.29", hours: null, state: "신청완료" },
  { id: "r3", title: "유기견 보호소 봉사", date: "2026.09.12", hours: null, state: "대기" },
  { id: "r4", title: "여름 집중 봉사", date: "2026.08.05", hours: 8, state: "활동완료" },
  { id: "r5", title: "무료급식 배식 봉사", date: "2026.07.18", hours: 4, state: "활동완료" },
  { id: "r6", title: "도서관 정리 봉사", date: "2026.07.04", hours: null, state: "취소" },
];

export interface Badge {
  id: string;
  label: string;
  desc: string;
  earned: boolean;
}

export const badges: Badge[] = [
  { id: "b1", label: "첫 봉사", desc: "첫 봉사활동 참여", earned: true },
  { id: "b2", label: "새로운 분야", desc: "3개 분야 이상 참여", earned: true },
  { id: "b3", label: "후기 작성", desc: "활동 후기 5회 작성", earned: true },
  { id: "b4", label: "연속 참여", desc: "3개월 연속 참여", earned: true },
  { id: "b5", label: "운영 보조", desc: "봉사 진행 보조 참여", earned: false },
  { id: "b6", label: "기수 목표", desc: "기수 공동 목표 달성", earned: false },
];

export const myTeamDetail = {
  eventTitle: "제26회 해랑사리우 MT",
  teamName: "MT 3조",
  leader: "김해랑",
  members: ["김해랑", "홍근", "서지우", "이준호", "박서연", "최민재"],
  dateLabel: "9.19 (금) – 9.21 (일)",
  place: "가평 청평유원지",
};
