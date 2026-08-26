"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { inSemester, recentSemesters, semesterOf } from "@/lib/semester";

interface SemesterContextValue {
  semester: string;
  setSemester: (value: string) => void;
  /** 고를 수 있는 학기 — 지금 학기부터 과거로 몇 개 */
  semesters: { value: string; label: string }[];
  isCurrent: boolean;
  /** 지난 학기를 보는 중이면 true. 새로 쓰기·수정·삭제를 막는 기준으로 쓴다.
      읽기·검색·복사·내보내기는 이 값과 상관없이 항상 된다. */
  readOnly: boolean;
  /** 학기 전환은 관리자만 — 운영진은 볼 수만 있고 바꿀 수 없다. */
  canChangeSemester: boolean;
  /** 그 날짜가 지금 보고 있는 학기에 드는지 — 목록을 거를 때 쓴다 */
  matches: (dateish: string | null | undefined) => boolean;
}

const SemesterContext = createContext<SemesterContextValue | null>(null);

/**
 * 학기 목록과 "지금 학기" 를 여기 한 곳에 둔다. 지난 학기는 역대 기록을
 * 남겨두는 자리라 새로 쓰지 못하게 하고, 지금 학기부터 다시 쓸 수 있게 연다.
 * 지금 학기는 오늘 날짜에서 뽑으므로 학기가 바뀌어도 손댈 게 없다.
 */
export function SemesterProvider({
  children,
  role,
}: {
  children: ReactNode;
  /** 로그인한 사람의 역할 — 관리자만 학기를 바꿀 수 있다 */
  role: "운영진" | "관리자";
}) {
  const semesters = useMemo(() => recentSemesters(4), []);
  const current = semesters[0].value;
  const [semester, setSemester] = useState<string>(current);
  const isCurrent = semester === current;

  const value = useMemo(
    () => ({
      semester,
      setSemester,
      semesters,
      isCurrent,
      readOnly: !isCurrent,
      canChangeSemester: role === "관리자",
      matches: (dateish: string | null | undefined) => inSemester(dateish, semester),
    }),
    [semester, semesters, isCurrent, role],
  );

  return <SemesterContext.Provider value={value}>{children}</SemesterContext.Provider>;
}

export function useSemester() {
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error("useSemester 는 SemesterProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}

export { semesterOf };
