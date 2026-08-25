/**
 * 학번을 Supabase Auth 로그인에 쓸 이메일로 바꾼다 — 회원 앱과 같은 계정을 쓰기 위한 변환.
 * apps/main 의 studentIdToEmail 과 반드시 같은 규칙이어야 한다.
 */
export function studentIdToEmail(studentId: string) {
  return `${studentId}@haerangsariwoo.site`;
}

/** 비밀번호 — 6자 이상 (회원 앱과 동일한 규칙) */
export function isValidPassword(v: string) {
  return v.length >= 6;
}
