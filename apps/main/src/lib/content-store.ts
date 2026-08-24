"use client";

import { useSyncExternalStore } from "react";

/**
 * 관리자 콘텐츠 저장 — Supabase 연동 전까지 브라우저 localStorage 를 임시
 * 저장소로 쓴다. 관리자 페이지에서 저장하면 이 스토리지에 쓰고, 공개
 * 페이지는 useContentOverride 로 이 값을 구독한다.
 * useSyncExternalStore 를 쓰는 이유: 서버 렌더링 시점엔 localStorage 에
 * 접근할 수 없어 항상 시드 값을 먼저 그려야 하는데(안 그러면 하이드레이션
 * 경고가 난다), effect 안에서 직접 setState 하는 대신 이 훅이 그
 * 서버/클라이언트 스냅샷 분리를 표준적으로 처리해 준다.
 */

const PREFIX = "haerang-main-content:";

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function loadOverride<T>(key: string): T | null {
  const raw = readRaw(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveOverride<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** 공개 페이지에서 저장된 값을 구독한다. 없으면 seed 를 그대로 쓴다. */
export function useContentOverride<T>(key: string, seed: T): T {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  if (!raw) return seed;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}
