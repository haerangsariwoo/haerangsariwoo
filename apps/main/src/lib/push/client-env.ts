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

/**
 * 아이패드인가.
 *
 * iPadOS 13 부터 사파리는 기본으로 맥 이름표를 달고 다닌다. iPad 라는
 * 글자로 찾으면 못 잡아서, 아이패드 사용자가 안드로이드 안내를 봤다.
 * 맥인데 손가락이 닿는 화면이면 아이패드로 본다.
 */
function iPadLike() {
  return (
    /iPad/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

export function useIsIPad() {
  return useClientValue(iPadLike, false);
}

export function useIsIOS() {
  return useClientValue(
    () => /iPhone|iPod/.test(navigator.userAgent) || iPadLike(),
    false,
  );
}

/**
 * 앱 안에 들어 있는 브라우저인가. 맞으면 그 앱 이름을 준다.
 *
 * 카카오톡으로 링크를 나눠 주면 카톡 안의 브라우저로 열린다. 거기에는
 * 공유 버튼도 브라우저 메뉴도 없어서 홈 화면 추가가 아예 불가능하다.
 * 안내를 바꿔주지 않으면 없는 단추를 찾게 된다.
 */
export function useInAppBrowser(): string | null {
  return useClientValue(() => {
    const ua = navigator.userAgent;
    if (/KAKAOTALK/i.test(ua)) return "카카오톡";
    if (/NAVER\(inapp/i.test(ua)) return "네이버 앱";
    if (/Instagram/i.test(ua)) return "인스타그램";
    if (/FBAN|FBAV/i.test(ua)) return "페이스북";
    if (/Line\//i.test(ua)) return "라인";
    return null;
  }, null);
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
