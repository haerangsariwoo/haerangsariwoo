"use client";

import { useSyncExternalStore } from "react";

/**
 * 지원 흐름 1단계에서 확인한 학번을 2단계로 넘긴다.
 * 학번은 개인 식별 정보라 URL 쿼리에 남기지 않고,
 * 탭을 닫으면 사라지는 sessionStorage 에만 둔다.
 * 본인 지정번호는 비밀번호 성격이라 저장하지 않는다.
 *
 * Supabase 연동 시 서버 세션으로 대체한다.
 */
const KEY = "haerang.apply.studentId";

export function saveStudentId(studentId: string) {
  try {
    sessionStorage.setItem(KEY, studentId);
  } catch {
    // 사생활 보호 모드 등에서 막힐 수 있다. 없으면 2단계에서 다시 묻는다.
  }
}

export function clearStudentId() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

/** 마운트 이후 값이 바뀌지 않으므로 구독은 비워둔다 */
const noopSubscribe = () => () => {};

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** 서버 렌더에서는 알 수 없는 값이라 스냅샷을 나눠 준다 */
export function useStudentId() {
  return useSyncExternalStore(noopSubscribe, read, () => null);
}
