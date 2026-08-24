import type { BadgeTone } from "@/components/admin/DataTable/DataTable";

export const metrics = [
  { label: "오늘 봉사", value: "2건", caption: "진행 예정", tone: "blue" as const, icon: "sun" },
  { label: "출석 현황", value: "18 / 24명", caption: "75% 참여", tone: "green" as const, icon: "check" },
  { label: "미승인 봉사시간", value: "7건", caption: "검토 필요", tone: "orange" as const, icon: "alert" },
  { label: "가입 승인 대기", value: "3명", caption: "검토 필요", tone: "purple" as const, icon: "plus" },
];

export interface TodayVolunteer {
  id: string;
  title: string;
  time: string;
  applied: string;
  attended: string;
  status: string;
  tone: BadgeTone;
}

export const todayVolunteers: TodayVolunteer[] = [
  {
    id: "tv1",
    title: "아동센터 교육 봉사",
    time: "13:00–16:00",
    applied: "12 / 16",
    attended: "9명",
    status: "진행 예정",
    tone: "blue",
  },
  {
    id: "tv2",
    title: "한강 플로깅",
    time: "15:00–17:00",
    applied: "18 / 20",
    attended: "9명",
    status: "진행 중",
    tone: "green",
  },
  {
    id: "tv3",
    title: "무료급식 배식",
    time: "18:00–20:00",
    applied: "20 / 20",
    attended: "—",
    status: "모집 마감",
    tone: "grey",
  },
];

export interface PendingHour {
  id: string;
  name: string;
  activity: string;
  hours: string;
  tone: "blue" | "green" | "orange";
}

export const pendingHours: PendingHour[] = [
  { id: "ph1", name: "이서연", activity: "한강 플로깅", hours: "2시간", tone: "blue" },
  { id: "ph2", name: "박민준", activity: "아동센터 교육", hours: "3시간", tone: "green" },
  { id: "ph3", name: "최하늘", activity: "급식소 배식", hours: "4시간", tone: "orange" },
];

export const upcomingEvents = [
  { id: "ue1", date: "8.16", title: "한강 플로깅", time: "15:00", tone: "orange" as const },
  { id: "ue2", date: "8.22", title: "정기총회", time: "18:30", tone: "blue" as const },
];

export const quickActions = [
  { id: "qa1", label: "봉사시간 승인", desc: "7건의 증빙 검토", href: "/admin/hours" as const, tone: "orange" as const },
  { id: "qa2", label: "출석 처리", desc: "참여 여부 확인", href: "/admin/applicants" as const, tone: "blue" as const },
  { id: "qa3", label: "가입 승인", desc: "신규 가입 신청 검토", href: "/admin/members" as const, tone: "green" as const },
  { id: "qa4", label: "팀짜기", desc: "행사 조 편성", href: "/admin/teams" as const, tone: "purple" as const },
];

/* ---------- 봉사활동 관리 ---------- */
export interface AdminVolunteer {
  id: string;
  title: string;
  date: string;
  place: string;
  applied: number;
  capacity: number;
  creditHours: number;
  source: "내부" | "1365" | "VMS";
  status: string;
  tone: BadgeTone;
  /** 등록된 대표 이미지. 없으면 동아리 로고가 기본으로 쓰인다 */
  imageUrl?: string;
}

export const adminVolunteers: AdminVolunteer[] = [
  { id: "v3", title: "아동센터 교육 봉사", date: "8.22 (토)", place: "성북꿈나무센터", applied: 13, capacity: 16, creditHours: 3, source: "내부", status: "마감 임박", tone: "orange" },
  { id: "v1", title: "한강 플로깅", date: "8.29 (토)", place: "뚝섬한강공원", applied: 9, capacity: 15, creditHours: 3, source: "내부", status: "모집 중", tone: "blue" },
  { id: "v2", title: "무료급식 배식 봉사", date: "9.05 (토)", place: "성북종합사회복지관", applied: 17, capacity: 20, creditHours: 4, source: "1365", status: "모집 중", tone: "blue" },
  { id: "v4", title: "유기견 보호소 봉사", date: "9.12 (토)", place: "성북 동물보호센터", applied: 12, capacity: 12, creditHours: 3, source: "VMS", status: "모집 마감", tone: "grey" },
];

/* ---------- 신청자·대기자 ---------- */
export interface Applicant {
  id: string;
  name: string;
  studentId: string;
  cohort: string;
  volunteer: string;
  appliedAt: string;
  state: "참여확정" | "신청완료" | "대기" | "불참" | "노쇼";
  waitNo?: number;
}

export const applicants: Applicant[] = [
  { id: "ap1", name: "재겸", studentId: "2591001", cohort: "26-1기", volunteer: "아동센터 교육 봉사", appliedAt: "08.14", state: "참여확정" },
  { id: "ap2", name: "이서연", studentId: "2591044", cohort: "26-1기", volunteer: "아동센터 교육 봉사", appliedAt: "08.14", state: "참여확정" },
  { id: "ap3", name: "박민준", studentId: "2491120", cohort: "25-2기", volunteer: "한강 플로깅", appliedAt: "08.15", state: "신청완료" },
  { id: "ap4", name: "최하늘", studentId: "2591137", cohort: "26-1기", volunteer: "한강 플로깅", appliedAt: "08.16", state: "대기", waitNo: 1 },
  { id: "ap5", name: "서지우", studentId: "2491077", cohort: "25-2기", volunteer: "아동센터 교육 봉사", appliedAt: "08.12", state: "노쇼" },
];

/* ---------- 봉사시간 승인 ---------- */
export interface HourRequest {
  id: string;
  name: string;
  studentId: string;
  volunteer: string;
  date: string;
  hours: number;
  proof: string;
  state: "대기" | "승인" | "반려";
}

export const hourRequests: HourRequest[] = [
  { id: "hr1", name: "이서연", studentId: "2591044", volunteer: "한강 플로깅", date: "08.14", hours: 2, proof: "사진 2장", state: "대기" },
  { id: "hr2", name: "박민준", studentId: "2491120", volunteer: "아동센터 교육", date: "08.12", hours: 3, proof: "사진 1장", state: "대기" },
  { id: "hr3", name: "최하늘", studentId: "2591137", volunteer: "급식소 배식", date: "08.10", hours: 4, proof: "확인서", state: "대기" },
  { id: "hr4", name: "재겸", studentId: "2591001", volunteer: "여름 집중 봉사", date: "08.05", hours: 8, proof: "확인서", state: "승인" },
];

/* ---------- 회원 관리 ---------- */
export interface AdminMember {
  id: string;
  name: string;
  studentId: string;
  /** 생년월일 6자리 — 부원 정보용 (로그인에는 쓰지 않음) */
  birth: string;
  gender: "남" | "여";
  /** 가입 연도·학기 표기 (예: 26-1기) */
  cohort: string;
  track: string;
  mbti?: string;
  role: "부원" | "운영진";
  hours: number;
}

export const adminMembers: AdminMember[] = [
  { id: "m1", name: "김우영", studentId: "2391005", birth: "010204", gender: "남", cohort: "24-1기", track: "IT공과대 · 컴퓨터공학", mbti: "ENTJ", role: "운영진", hours: 124 },
  { id: "m2", name: "재겸", studentId: "2591001", birth: "060312", gender: "남", cohort: "26-1기", track: "IT공과대 · 컴퓨터공학", mbti: "INFJ", role: "운영진", hours: 76 },
  { id: "m3", name: "이서연", studentId: "2591044", birth: "060821", gender: "여", cohort: "26-1기", track: "디자인대 · 시각디자인", mbti: "ENFP", role: "부원", hours: 58 },
  { id: "m4", name: "박민준", studentId: "2491120", birth: "050415", gender: "남", cohort: "25-2기", track: "사회과학대 · 행정학", mbti: "ISTP", role: "부원", hours: 92 },
  { id: "m5", name: "최하늘", studentId: "2591137", birth: "061103", gender: "여", cohort: "26-1기", track: "인문대 · 국어국문", mbti: "ISFJ", role: "부원", hours: 41 },
];

/* ---------- 팀짜기 ----------
   "회원 명부"(누가 있는지)와 "행사별 조 편성"(이번 행사엔 누가 참여하고
   어느 조인지)을 나눈다. 예전엔 이 둘이 한 행에 뒤섞여 있어서(팀짜기
   화면 하나가 곧 한 행사였다), 행사를 여러 개 만들 수가 없었다. */
export interface TeamMemberRow {
  id: string;
  name: string;
  cohort: string;
  gender: "남" | "여";
}

/** 팀짜기에 올릴 수 있는 회원 명부 */
export const teamPool: TeamMemberRow[] = [
  { id: "t1", name: "김해랑", cohort: "25-2기", gender: "남" },
  { id: "t2", name: "재겸", cohort: "26-1기", gender: "남" },
  { id: "t3", name: "서지우", cohort: "25-2기", gender: "여" },
  { id: "t4", name: "이준호", cohort: "26-1기", gender: "남" },
  { id: "t5", name: "박서연", cohort: "26-1기", gender: "여" },
  { id: "t6", name: "최민재", cohort: "25-2기", gender: "여" },
  { id: "t7", name: "정다은", cohort: "26-1기", gender: "여" },
  { id: "t8", name: "강태현", cohort: "25-2기", gender: "남" },
];

/**
 * 행사 하나의 조 편성. activityId 로 lib/activities 의 실제 활동과
 * 이어진다 — 팀짜기 화면에 날짜·장소를 다시 적지 않고 거기서 가져온다.
 */
export interface TeamEventDraft {
  id: string;
  activityId: string;
  teamSize: number;
  /** 이 행사에 참여하는 사람 (teamPool 중 일부) */
  participantIds: string[];
  /** 참여자 id → 조 번호. 아직 안 나눴으면 null */
  assignments: Record<string, number | null>;
  /** 부원 홈·내 조에 노출할 행사인지. 한 번에 하나만 켜진다 */
  published: boolean;
}

export const teamEvents: TeamEventDraft[] = [
  {
    id: "te1",
    activityId: "a2",
    teamSize: 6,
    participantIds: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"],
    assignments: { t1: 3, t2: 3, t3: 3, t4: 3, t5: 3, t6: 3, t7: null, t8: null },
    published: true,
  },
];

/* ---------- 운영진 게시판 ---------- */
export interface BoardPost {
  id: string;
  category: "회의록" | "운영 공지" | "자료" | "자유";
  title: string;
  author: string;
  date: string;
  files: number;
}

export const boardPosts: BoardPost[] = [
  { id: "bp1", category: "회의록", title: "8월 3주차 운영진 회의록", author: "김우영", date: "2026.08.19", files: 1 },
  { id: "bp2", category: "운영 공지", title: "2학기 예산 집행 기준 안내", author: "이서연", date: "2026.08.17", files: 2 },
  { id: "bp3", category: "자료", title: "MT 장소 후보 비교표", author: "박민준", date: "2026.08.15", files: 3 },
  { id: "bp4", category: "회의록", title: "26-2기 모집 준비 회의록", author: "김우영", date: "2026.08.11", files: 0 },
];

/* ---------- 협력기관 ---------- */
export const partners = [
  { id: "p1", name: "성북종합사회복지관", contact: "02-921-4180", activities: 11, since: "2019" },
  { id: "p2", name: "성북꿈나무센터", contact: "02-940-5327", activities: 26, since: "2016" },
  { id: "p3", name: "성북구 자원봉사센터", contact: "02-2241-6068", activities: 8, since: "2021" },
  { id: "p4", name: "성북 동물보호센터", contact: "02-914-7712", activities: 5, since: "2023" },
];

/* ---------- 통계 ---------- */
export const monthlyStats = [
  { month: "3월", hours: 86 },
  { month: "4월", hours: 124 },
  { month: "5월", hours: 152 },
  { month: "6월", hours: 98 },
  { month: "7월", hours: 168 },
  { month: "8월", hours: 142 },
];

export const categoryStats = [
  { label: "교육", value: 38, tone: "blue" as const },
  { label: "환경", value: 31, tone: "green" as const },
  { label: "복지", value: 21, tone: "orange" as const },
  { label: "기타", value: 7, tone: "purple" as const },
];
