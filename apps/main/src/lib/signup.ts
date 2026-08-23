/**
 * 회원가입 · 승인 대기 데이터.
 * 로그인은 학번(ID) + 개인 비밀번호 4자리(PW)로 한다.
 * 생년월일은 부원 정보로만 수집하며 로그인에는 쓰지 않는다.
 * Supabase 연동 시 members / signup_requests 테이블로 대체한다.
 */

export type Gender = "남" | "여";
export type SignupState = "대기" | "승인" | "반려";
export type Semester = 1 | 2;

export const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;

/** 가입 연도 선택지 (현재 연도 기준 앞뒤로 여유를 둔다) */
export const JOIN_YEARS = [2024, 2025, 2026, 2027] as const;

export interface SignupRequest {
  id: string;
  name: string;
  gender: Gender;
  /** 트랙(학과) — 자유 입력 */
  track: string;
  /** 학번 — 로그인 ID */
  studentId: string;
  /** 생년월일 6자리(YYMMDD) — 부원 정보용 */
  birth: string;
  /** 동아리 가입 연도 (예: 2026) */
  joinYear: number;
  /** 동아리 가입 학기 (1 또는 2) */
  joinSemester: Semester;
  /** 선택 항목 */
  mbti?: string;
  requestedAt: string;
  state: SignupState;
}

/** 가입 연도·학기를 "26-1기" 형태로 표기한다 */
export function cohortLabel(year: number, semester: Semester) {
  return `${String(year).slice(2)}-${semester}기`;
}

export const signupRequests: SignupRequest[] = [
  {
    id: "sr1",
    name: "정다은",
    gender: "여",
    track: "디자인대 · 시각디자인",
    studentId: "2591204",
    birth: "060312",
    joinYear: 2026,
    joinSemester: 2,
    mbti: "ENFP",
    requestedAt: "08.21",
    state: "대기",
  },
  {
    id: "sr2",
    name: "강태현",
    gender: "남",
    track: "IT공과대 · 웹공학",
    studentId: "2591188",
    birth: "051127",
    joinYear: 2026,
    joinSemester: 2,
    mbti: "INTJ",
    requestedAt: "08.20",
    state: "대기",
  },
  {
    id: "sr3",
    name: "윤소민",
    gender: "여",
    track: "사회과학대 · 경제학",
    studentId: "2591230",
    birth: "060708",
    joinYear: 2026,
    joinSemester: 2,
    requestedAt: "08.19",
    state: "대기",
  },
  {
    id: "sr4",
    name: "임재현",
    gender: "남",
    track: "인문대 · 영어영문",
    studentId: "2591155",
    birth: "050914",
    joinYear: 2026,
    joinSemester: 1,
    mbti: "ESFJ",
    requestedAt: "08.17",
    state: "승인",
  },
];

/** 학번 형식 검사 */
export function isValidStudentId(v: string) {
  return /^\d{7}$/.test(v);
}

/** 비밀번호 — 숫자 4자리 */
export function isValidPassword(v: string) {
  return /^\d{4}$/.test(v);
}

/** 생년월일 6자리 형식 검사 (YYMMDD) */
export function isValidBirth(v: string) {
  if (!/^\d{6}$/.test(v)) return false;
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}
