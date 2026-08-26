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
