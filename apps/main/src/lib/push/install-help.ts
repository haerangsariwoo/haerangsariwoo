"use client";

import { useEffect, useState } from "react";
import { useIsIOS, useIsIPad, useInAppBrowser } from "./client-env";

/** 크롬 계열이 띄워주는 설치 프롬프트 이벤트 */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

/**
 * 이 기기에서 홈 화면에 추가하는 방법.
 *
 * 안내가 두 곳(홈 팝업·마이 카드)에 있어 한쪽만 고쳐지기 쉬웠다. 판단과
 * 문구를 여기 모으고, 화면은 받아서 그리기만 한다.
 */
export type InstallHow =
  /** 카카오톡 같은 앱 안의 브라우저 — 여기서는 아예 설치가 안 된다 */
  | { kind: "inapp"; app: string; steps: string[] }
  | { kind: "ios"; steps: string[] }
  /** 크롬 계열이 설치를 맡아주는 경우 */
  | { kind: "prompt"; install: () => void }
  | { kind: "manual"; text: string };

const IOS_STEPS = (bottom: boolean) => [
  `사파리 ${bottom ? "아래쪽" : "위쪽"} 공유 버튼을 누르세요.`,
  "“홈 화면에 추가”를 선택하세요.",
  "홈 화면의 해랑사리우 아이콘으로 들어와 주세요.",
];

const INAPP_STEPS = [
  "오른쪽 위 ⋮ 또는 ⋯ 버튼을 누르세요.",
  "“다른 브라우저로 열기”를 선택하세요.",
  "크롬이나 사파리에서 열린 뒤 다시 안내를 따라 주세요.",
];

export function useInstallHelp(onInstall?: () => void): InstallHow {
  const isIOS = useIsIOS();
  const isIPad = useIsIPad();
  const inApp = useInAppBrowser();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // 앱 안의 브라우저는 기기와 상관없이 먼저 걸러야 한다 — 여기서는
  // 공유 버튼도 브라우저 메뉴도 없어서 어떤 안내를 해도 따라올 수 없다
  if (inApp) return { kind: "inapp", app: inApp, steps: INAPP_STEPS };

  // 아이패드는 공유 버튼이 위쪽에 있다
  if (isIOS) return { kind: "ios", steps: IOS_STEPS(!isIPad) };

  if (deferred) {
    return {
      kind: "prompt",
      install: () => {
        void deferred.prompt();
        setDeferred(null);
        onInstall?.();
      },
    };
  }

  return {
    kind: "manual",
    text: "브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택해 주세요.",
  };
}
