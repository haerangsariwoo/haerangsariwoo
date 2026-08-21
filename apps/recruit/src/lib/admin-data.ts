export type FirstResult = "대기" | "합격" | "불합격";
export type FinalResult = "대기" | "합격" | "불합격";

export interface Applicant {
  id: string;
  name: string;
  studentId: string;
  track: string;
  phone: string;
  motivation: string;
  appliedAt: string;
  first: FirstResult;
  interview: string | null;
  final: FinalResult;
}

export const applicants: Applicant[] = [
  {
    id: "a1",
    name: "재겸",
    studentId: "2591001",
    track: "IT공과대 · 컴퓨터공학",
    phone: "010-1234-5678",
    motivation: "봉사를 통해 꾸준히 나누는 사람이 되고 싶어 지원했습니다.",
    appliedAt: "08.26",
    first: "합격",
    interview: "9.11 (목) 15:00",
    final: "합격",
  },
  {
    id: "a2",
    name: "서지우",
    studentId: "2591044",
    track: "디자인대 · 시각디자인",
    phone: "010-2233-4455",
    motivation: "30년 전통이라는 점이 신뢰가 갔고, 함께 성장하고 싶습니다.",
    appliedAt: "08.27",
    first: "합격",
    interview: "9.12 (금) 11:30",
    final: "대기",
  },
  {
    id: "a3",
    name: "이준호",
    studentId: "2591099",
    track: "사회과학대 · 행정학",
    phone: "010-8899-1010",
    motivation: "친목과 MT 활동이 인상 깊었고 새로운 사람들을 만나고 싶습니다.",
    appliedAt: "08.28",
    first: "합격",
    interview: null,
    final: "대기",
  },
  {
    id: "a4",
    name: "박서연",
    studentId: "2591120",
    track: "인문대 · 국어국문",
    phone: "010-5566-7788",
    motivation: "교육봉사 경험을 이어가고 싶어 지원하게 되었습니다.",
    appliedAt: "08.29",
    first: "대기",
    interview: null,
    final: "대기",
  },
  {
    id: "a5",
    name: "최민재",
    studentId: "2591137",
    track: "IT공과대 · 정보시스템",
    phone: "010-3344-9900",
    motivation: "평소 환경 문제에 관심이 많아 플로깅 활동에 참여하고 싶습니다.",
    appliedAt: "08.30",
    first: "불합격",
    interview: null,
    final: "불합격",
  },
];

export const recruitMetrics = [
  { label: "총 지원", value: "48", unit: "명", tone: "blue" as const },
  { label: "1차 합격", value: "32", unit: "명", tone: "green" as const },
  { label: "면접 예약", value: "28", unit: "/ 32", tone: "orange" as const },
  { label: "최종 합격", value: "24", unit: "명", tone: "purple" as const },
];

export interface SlotRow {
  id: string;
  date: string;
  range: string;
  interval: string;
  booked: number;
  capacity: number;
}

export const slotRows: SlotRow[] = [
  { id: "sr1", date: "9.11 (목)", range: "14:00 – 17:00", interval: "30분", booked: 6, capacity: 6 },
  { id: "sr2", date: "9.12 (금)", range: "11:00 – 18:00", interval: "30분", booked: 9, capacity: 12 },
  { id: "sr3", date: "9.13 (토)", range: "10:00 – 16:00", interval: "30분", booked: 13, capacity: 14 },
];
