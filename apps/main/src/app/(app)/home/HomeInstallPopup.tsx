"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useIsIOS, useIsStandalone } from "@/lib/push/client-env";
import styles from "./HomeInstallPopup.module.css";

/** 크롬 계열이 띄워주는 설치 프롬프트 이벤트 */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "haerang-install-popup-dismissed";

const noopSubscribe = () => () => {};

/** 이 브라우저에서 이미 닫은 적 있는지 — 서버는 알 수 없으니 false 로 그린다 */
function useWasDismissed() {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return window.localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
}

/**
 * 홈 화면에 처음 들어왔을 때 "홈 화면에 추가" 안내를 팝업으로 먼저
 * 보여준다. 한 번 닫으면(설치하거나 나중에 할게요) 다시 뜨지 않는다 —
 * MY 페이지의 같은 안내 카드는 그대로 남겨 언제든 다시 찾아볼 수 있다.
 */
export function HomeInstallPopup() {
  const isIOS = useIsIOS();
  const installed = useIsStandalone();
  const wasDismissed = useWasDismissed();
  const [dismissedNow, setDismissedNow] = useState(false);
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const open = !installed && !wasDismissed && !dismissedNow;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage 를 못 쓰는 환경이면 그냥 이번만 닫는다
    }
    setDismissedNow(true);
  }

  if (installed) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && dismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <Dialog.Title className={styles.title}>홈 화면에 추가하기</Dialog.Title>
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
              className={styles.installBtn}
              onClick={() => {
                void deferred.prompt();
                dismiss();
              }}
            >
              홈 화면에 추가
            </button>
          ) : (
            <p className={styles.desc}>
              브라우저 메뉴에서 &ldquo;앱 설치&rdquo; 또는 &ldquo;홈 화면에 추가&rdquo;를 선택해 주세요.
            </p>
          )}

          <button type="button" className={styles.laterBtn} onClick={dismiss}>
            나중에 할게요
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
