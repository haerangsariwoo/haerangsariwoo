/**
 * 모집 설정 — 브리핑 6-D 기준.
 * 기수·일정·지원서 문항·접수 on/off 는 모두 관리자 설정값이며 하드코딩하지 않는다.
 * Supabase 연동 시 recruits / landing_content 테이블에서 읽어온다.
 */

export type RecruitPhase = "before" | "open" | "closed" | "announced";

export interface RecruitConfig {
  /** 모집 연도 (예: 2026) */
  year: number;
  /** 모집 학기 (1 또는 2) */
  semesterNo: 1 | 2;
  semester: string;
  /** 지원 접수 on/off — 오프시즌에도 랜딩 소개는 계속 공개된다 */
  applicationsOpen: boolean;
  phase: RecruitPhase;
  applyStart: string;
  applyEnd: string;
  firstResultDate: string;
  interviewRange: string;
  finalResultDate: string;
}

export const recruitConfig: RecruitConfig = {
  year: 2026,
  semesterNo: 2,
  semester: "2026학년도 2학기",
  applicationsOpen: true,
  phase: "open",
  applyStart: "8.25 (월)",
  applyEnd: "9.05 (금)",
  firstResultDate: "9.08 (월)",
  interviewRange: "9.11 (목) – 9.13 (토)",
  finalResultDate: "9.16 (화)",
};

/** 가입 연도·학기를 "26-2기" 형태로 표기한다 (회원 앱과 동일 규칙) */
export function cohortLabel(year: number, semester: 1 | 2) {
  return `${String(year).slice(2)}-${semester}기`;
}

export const brand = {
  name: "해랑사리우",
  slogan1: "나눔으로 하나되는 우리,",
  slogan2: "봉사로 빛나는 청춘",
  tradition: "1996년부터 이어온 30년 봉사의 전통",
};

/** 랜딩 활동 카드 — 사진은 관리자가 상시 업로드·교체 */
export interface ActivityCard {
  id: string;
  title: string;
  desc: string;
  photoUrl: string | null;
}

export const activityCards: ActivityCard[] = [
  { id: "ac1", title: "봉사", desc: "지역사회와 함께", photoUrl: null },
  { id: "ac2", title: "친목", desc: "친해지길 바라", photoUrl: null },
  { id: "ac3", title: "MT", desc: "우리만의 추억", photoUrl: null },
];

export const processSteps = [
  { no: 1, label: "지원" },
  { no: 2, label: "1차 결과" },
  { no: 3, label: "면접 선택" },
  { no: 4, label: "최종 결과" },
];

export const faqs = [
  {
    q: "봉사 경험이 없어도 되나요?",
    a: "네! 대부분 처음 시작해요. 신입 부원 교육을 통해 함께 배워나가면 됩니다.",
  },
  {
    q: "결과는 어디서 확인하나요?",
    a: "지원 시 정한 학번과 본인 지정번호로 로그인하면 앱에서 바로 확인할 수 있어요.",
  },
  {
    q: "지원 자격이 어떻게 되나요?",
    a: "한성대학교 재학생이면 학부·트랙·학년 관계없이 누구나 지원할 수 있습니다.",
  },
];

/** 지원서 문항 — 관리자가 편집 가능 */
export interface FormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "tel" | "number" | "textarea";
  required: boolean;
  help?: string;
  maxLength?: number;
}

export const applicationFields: FormField[] = [
  {
    name: "track",
    label: "소속 (학부/트랙)",
    placeholder: "예: 웹공학트랙",
    type: "text",
    required: true,
  },
  { name: "name", label: "이름", placeholder: "이름을 입력해 주세요", type: "text", required: true },
  {
    name: "studentId",
    label: "학번",
    placeholder: "예: 2026000",
    type: "number",
    required: true,
  },
  {
    name: "phone",
    label: "연락처",
    placeholder: "010-0000-0000",
    type: "tel",
    required: true,
  },
];

export const motivationField: FormField = {
  name: "motivation",
  label: "지원 동기",
  placeholder: "해랑사리우와 함께하고 싶은 이유를 자유롭게 작성해 주세요.",
  type: "textarea",
  required: true,
  maxLength: 300,
};

/** 면접 슬롯 — 관리자가 날짜·시간대를 열어둔다 */
export interface InterviewSlot {
  id: string;
  date: string;
  time: string;
  taken: number;
  capacity: number;
}

export const interviewSlots: InterviewSlot[] = [
  { id: "s1", date: "9.11 (목)", time: "14:00", taken: 3, capacity: 3 },
  { id: "s2", date: "9.11 (목)", time: "14:30", taken: 2, capacity: 3 },
  { id: "s3", date: "9.11 (목)", time: "15:00", taken: 1, capacity: 3 },
  { id: "s4", date: "9.12 (금)", time: "11:00", taken: 3, capacity: 3 },
  { id: "s5", date: "9.12 (금)", time: "11:30", taken: 0, capacity: 3 },
  { id: "s6", date: "9.12 (금)", time: "13:00", taken: 2, capacity: 3 },
  { id: "s7", date: "9.13 (토)", time: "10:00", taken: 1, capacity: 3 },
  { id: "s8", date: "9.13 (토)", time: "10:30", taken: 2, capacity: 3 },
];

export const interviewPlace = "한성대학교 미래관 · 상세 장소는 예약 후 안내";

export const nextSteps = [
  "운영진 안내 확인",
  "메인 회원 앱 계정 발급",
  "신입 부원 교육 참여",
];
