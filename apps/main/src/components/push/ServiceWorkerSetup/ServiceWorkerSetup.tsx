"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push/register-sw";

/**
 * 앱을 열면 서비스워커를 한 번 등록해 둔다.
 *
 * 알림을 켜는 화면까지 가야 등록되던 것을 앞으로 당긴다. 화면에는 아무것도
 * 그리지 않는다. 실패해도 조용히 넘긴다 — 알림을 켤 때 다시 시도하고,
 * 그때는 실패를 사용자에게 알린다.
 */
export function ServiceWorkerSetup() {
  useEffect(() => {
    registerServiceWorker().catch(() => {});
  }, []);

  return null;
}
