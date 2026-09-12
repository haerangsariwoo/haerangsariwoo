"use client";

/**
 * 서비스워커를 등록한다.
 *
 * 등록 위치가 한 곳(마이 페이지)뿐이라, 거기를 안 가본 사람은 워커가 없는
 * 상태였다. 그러면 브라우저가 "설치할 만한 사이트" 로 보지 않아 홈 화면의
 * 설치 안내가 단추 대신 문구만 보여준다 — 처음 들어온 사람이 가장 안 되는
 * 구조였다.
 *
 * 같은 주소·같은 범위로 여러 번 불러도 브라우저가 이미 있는 등록을 돌려준다.
 */
export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.reject(new Error("service worker unsupported"));
  }

  return navigator.serviceWorker.register(
    new URL("../service-worker.js", import.meta.url),
    { scope: "/", updateViaCache: "none" },
  );
}
