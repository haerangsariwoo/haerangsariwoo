"use client";

import { useEffect, useState } from "react";
import { useIsIOS, useIsStandalone } from "@/lib/push/client-env";
import styles from "./InstallPrompt.module.css";

/** 크롬 계열이 띄워주는 설치 프롬프트 이벤트 */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

export function InstallPrompt() {
  const isIOS = useIsIOS();
  const installed = useIsStandalone();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  return (
    <div className={styles.card}>
      <p className={styles.title}>홈 화면에 추가하기</p>
      <p className={styles.desc}>앱처럼 바로 열 수 있고, 공지 알림도 받을 수 있어요.</p>

      {isIOS ? (
        <ol className={styles.steps}>
          <li>사파리 아래쪽 공유 버튼을 누르세요.</li>
          <li>&ldquo;홈 화면에 추가&rdquo;를 선택하세요.</li>
          <li>홈 화면의 해랑사리우 아이콘으로 들어와 주세요.</li>
        </ol>
      ) : deferred ? (
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            void deferred.prompt();
            setDeferred(null);
          }}
        >
          홈 화면에 추가
        </button>
      ) : (
        <p className={styles.desc}>
          브라우저 메뉴에서 &ldquo;앱 설치&rdquo; 또는 &ldquo;홈 화면에 추가&rdquo;를 선택해 주세요.
        </p>
      )}
    </div>
  );
}
