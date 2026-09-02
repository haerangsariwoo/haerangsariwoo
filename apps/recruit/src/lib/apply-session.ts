"use client";

import { useSyncExternalStore } from "react";

/**
 * 지원 흐름 1단계에서 확인한 학번·비밀번호를 2단계(제출)로 넘긴다.
 * 개인 식별 정보라 URL 쿼리에 남기지 않고, 탭을 닫으면 사라지는
 * sessionStorage 에만 둔다 — 지원 흐름이 끝나면 clearApplySession 으로 지운다.
 * (나중에 결과를 다시 확인하려면 본인이 정한 번호를 기억해야 한다 —
 * 여기 저장된 값은 이번 제출 흐름 안에서만 쓰인다.)
 */
const STUDENT_ID_KEY = "haerang.apply.studentId";
const CODE_KEY = "haerang.apply.code";

export function saveApplySession(studentId: string, code: string) {
  try {
    sessionStorage.setItem(STUDENT_ID_KEY, studentId);
    sessionStorage.setItem(CODE_KEY, code);
  } catch {
    // 사생활 보호 모드 등에서 막힐 수 있다. 없으면 폼에서 다시 확인이 필요하다.
  }
}

export function clearApplySession() {
  try {
    sessionStorage.removeItem(STUDENT_ID_KEY);
    sessionStorage.removeItem(CODE_KEY);
  } catch {
    /* 무시 */
  }
}

const noopSubscribe = () => () => {};

function readStudentId(): string | null {
  try {
    return sessionStorage.getItem(STUDENT_ID_KEY);
  } catch {
    return null;
  }
}

function readCode(): string | null {
  try {
    return sessionStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

/** 서버 렌더에서는 알 수 없는 값이라 스냅샷을 나눠 준다 */
export function useStudentId() {
  return useSyncExternalStore(noopSubscribe, readStudentId, () => null);
}

export function useApplyCode() {
  return useSyncExternalStore(noopSubscribe, readCode, () => null);
}
