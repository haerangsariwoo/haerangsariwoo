/**
 * 회원가입 · 승인 대기 데이터.
 * 로그인은 학번(ID) + 생년월일 6자리(PW)로 한다.
 * Supabase 연동 시 members / signup_requests 테이블로 대체한다.
 */

export type Gender = "남" | "여";
export type SignupState = "대기" | "승인" | "반려";

export const TRACKS = [
  "IT공과대 · 컴퓨터공학",
  "IT공과대 · 정보시스템",
  "IT공과대 · 웹공학",
  "디자인대 · 시각디자인",
  "디자인대 · 산업디자인",
  "사회과학대 · 행정학",
  "사회과학대 · 경제학",
  "인문대 · 국어국문",
  "인문대 · 영어영문",
  "기타",
] as const;

export const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;

export interface SignupRequest {
  id: string;
  name: string;
  gender: Gender;
  track: string;
  /** 학번 — 로그인 ID */
  studentId: string;
  /** 생년월일 6자리(YYMMDD) — 로그인 비밀번호 */
  birth: string;
  /** 선택 항목 */
  mbti?: string;
  requestedAt: string;
  state: SignupState;
}

export const signupRequests: SignupRequest[] = [
  {
    id: "sr1",
    name: "정다은",
    gender: "여",
    track: "디자인대 · 시각디자인",
    studentId: "2591204",
    birth: "060312",
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
    mbti: "ESFJ",
    requestedAt: "08.17",
    state: "승인",
  },
];

/** 생년월일 6자리 형식 검사 (YYMMDD) */
export function isValidBirth(v: string) {
  if (!/^\d{6}$/.test(v)) return false;
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}

/** 학번 형식 검사 */
export function isValidStudentId(v: string) {
  return /^\d{7}$/.test(v);
}
