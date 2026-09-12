"use client";

import { useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useIsStandalone } from "@/lib/push/client-env";
import { useInstallHelp } from "@/lib/push/install-help";
import styles from "./HomeInstallPopup.module.css";

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
  const installed = useIsStandalone();
  const wasDismissed = useWasDismissed();
  const [dismissedNow, setDismissedNow] = useState(false);
  // 설치를 누르면 팝업도 닫는다
  const how = useInstallHelp(() => dismiss());

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

          {how.kind === "inapp" && (
            <>
              <p className={styles.desc}>
                지금은 {how.app} 안의 브라우저로 보고 있어요. 여기서는 홈 화면에 추가할 수 없어요.
              </p>
              <ol className={styles.steps}>
                {how.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </>
          )}

          {how.kind === "ios" && (
            <ol className={styles.steps}>
              {how.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}

          {how.kind === "prompt" && (
            <button type="button" className={styles.installBtn} onClick={how.install}>
              홈 화면에 추가
            </button>
          )}

          {how.kind === "manual" && <p className={styles.desc}>{how.text}</p>}

          <button type="button" className={styles.laterBtn} onClick={dismiss}>
            나중에 할게요
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
