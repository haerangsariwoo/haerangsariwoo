"use client";

import { useSyncExternalStore } from "react";

/**
 * 브라우저 환경을 읽어오는 훅들.
 * 서버 렌더에서는 알 수 없는 값이라 useSyncExternalStore 로
 * 서버 스냅샷과 클라이언트 스냅샷을 나눠 준다.
 */

/** 마운트 이후 값이 바뀌지 않으므로 구독은 비워둔다 */
const noopSubscribe = () => () => {};

function useClientValue<T>(get: () => T, serverValue: T) {
  return useSyncExternalStore(noopSubscribe, get, () => serverValue);
}

/** 홈 화면에 추가된 상태로 실행 중인지 */
export function useIsStandalone() {
  return useClientValue(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS 사파리는 navigator.standalone 으로만 알 수 있다
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    false,
  );
}

export function useIsIOS() {
  return useClientValue(() => /iPad|iPhone|iPod/.test(navigator.userAgent), false);
}

/** 이 브라우저에 푸시 API 가 있는지 (iOS 는 홈 화면 추가 전까지 없다) */
export function useSupportsPush() {
  return useClientValue(
    () => "serviceWorker" in navigator && "PushManager" in window,
    false,
  );
}

/** 알림 권한이 차단된 상태인지 */
export function useNotificationDenied() {
  return useClientValue(
    () => typeof Notification !== "undefined" && Notification.permission === "denied",
    false,
  );
}
