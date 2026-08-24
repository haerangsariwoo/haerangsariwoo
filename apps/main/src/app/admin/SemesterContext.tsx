"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * 학기 목록과 "지금 학기" 를 여기 한 곳에 둔다. 지난 학기는 역대 기록을
 * 남겨두는 자리라 새로 쓰지 못하게 하고, 지금 학기부터 다시 쓸 수 있게
 * 연다 — 26-2학기가 그 시작이다.
 */
export const SEMESTERS = [
  { value: "2026-2", label: "2026-2학기" },
  { value: "2026-1", label: "2026-1학기" },
  { value: "2025-2", label: "2025-2학기" },
] as const;

export const CURRENT_SEMESTER = "2026-2";

interface SemesterContextValue {
  semester: string;
  setSemester: (value: string) => void;
  isCurrent: boolean;
  /** 지난 학기를 보는 중이면 true. 새로 쓰기·수정·삭제를 막는 기준으로 쓴다.
      읽기·검색·복사·내보내기는 이 값과 상관없이 항상 된다. */
  readOnly: boolean;
}

const SemesterContext = createContext<SemesterContextValue | null>(null);

export function SemesterProvider({ children }: { children: ReactNode }) {
  const [semester, setSemester] = useState<string>(CURRENT_SEMESTER);
  const isCurrent = semester === CURRENT_SEMESTER;

  return (
    <SemesterContext.Provider value={{ semester, setSemester, isCurrent, readOnly: !isCurrent }}>
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error("useSemester 는 SemesterProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}
