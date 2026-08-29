/**
 * 회원가입 관련 검증·변환 함수.
 * 로그인은 학번(ID) + 비밀번호(6자 이상)로 한다.
 * 생년월일은 부원 정보로만 수집하며 로그인에는 쓰지 않는다.
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

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 15;

/** 입력칸 아래에 늘 보여주는 안내 — 규칙을 틀리고 나서 알게 하지 않는다 */
export const PASSWORD_HINT = `영문과 숫자를 섞어 ${PASSWORD_MIN}~${PASSWORD_MAX}자로 정해 주세요.`;

/**
 * 새로 정하는 비밀번호가 규칙에 맞는지 본다. 맞으면 null, 아니면 사유.
 *
 * 로그인에는 쓰지 않는다 — 규칙이 생기기 전에 가입한 사람들이 있고,
 * 그 사람들의 비밀번호는 여전히 맞는 비밀번호다. 로그인에서 막으면
 * 멀쩡한 회원이 자기 계정에 못 들어간다.
 */
export function checkNewPassword(v: string): string | null {
  if (v.length < PASSWORD_MIN || v.length > PASSWORD_MAX) {
    return `비밀번호는 ${PASSWORD_MIN}자 이상 ${PASSWORD_MAX}자 이하로 정해 주세요.`;
  }
  if (/\s/.test(v)) return "비밀번호에 공백은 쓸 수 없어요.";
  if (!/[A-Za-z]/.test(v)) return "영문을 하나 이상 넣어 주세요.";
  if (!/[0-9]/.test(v)) return "숫자를 하나 이상 넣어 주세요.";
  return null;
}

/** 로그인 — 규칙이 아니라 "입력했는가" 만 본다 (위 설명 참고) */
export function isValidPassword(v: string) {
  return v.length > 0;
}

/**
 * 학번을 Supabase Auth 가입에 쓸 이메일로 바꾼다 — 실제 이메일이 없어도 되게 하는 자리표시자.
 * .internal 같은 예약된 TLD는 Supabase 이메일 형식 검사에서 막히기 때문에
 * 우리가 실제로 소유한 도메인을 붙인다 (수신함은 없지만 형식은 유효하다).
 */
export function studentIdToEmail(studentId: string) {
  return `${studentId}@haerangsariwoo.site`;
}

/** 생년월일 6자리 형식 검사 (YYMMDD) */
export function isValidBirth(v: string) {
  if (!/^\d{6}$/.test(v)) return false;
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}
