"use client";

import { useIsStandalone } from "@/lib/push/client-env";
import { useInstallHelp } from "@/lib/push/install-help";
import styles from "./InstallPrompt.module.css";

export function InstallPrompt() {
  const installed = useIsStandalone();
  const how = useInstallHelp();

  if (installed) return null;

  return (
    <div className={styles.card}>
      <p className={styles.title}>홈 화면에 추가하기</p>
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
        <button type="button" className={styles.button} onClick={how.install}>
          홈 화면에 추가
        </button>
      )}

      {how.kind === "manual" && <p className={styles.desc}>{how.text}</p>}
    </div>
  );
}
