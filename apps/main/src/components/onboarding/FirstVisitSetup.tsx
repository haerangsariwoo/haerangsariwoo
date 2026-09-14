"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAppTour } from "./AppTour";
import { InstallInstructions } from "@/components/push/InstallPrompt/InstallPrompt";
import { PushSettings } from "@/components/push/PushSettings/PushSettings";
import { useInstallHelp } from "@/lib/push/install-help";
import { initialSetupPhase, nextSetupPhase, SETUP_KEY, SETUP_RESTART, type SetupPhase } from "@/lib/first-visit";
import styles from "./FirstVisitSetup.module.css";

const TITLES = {
  welcome: "처음이라면, 같이 둘러봐요",
  install: "홈 화면에서 바로 만나요",
  notifications: "새 소식, 놓치지 않도록",
};
const DESCRIPTIONS = {
  welcome: "실제 버튼을 눌러보며 활동과 내 기록을 찾는 7단계 가이드예요.",
  install: "해랑사리우 아이콘을 추가하면 다음부터 더 편하게 열 수 있어요.",
  notifications: "공지 알림을 켜두면 새 소식을 휴대폰으로 받을 수 있어요. 원할 때만 허용해 주세요.",
};

export function FirstVisitSetup() {
  const { ready, welcome, active, start, dismiss } = useAppTour();
  const [phase, setPhase] = useState<SetupPhase | null>(null);
  const initialized = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  // Mounted throughout the tour so an early install event is not lost.
  const how = useInstallHelp();
  const go = useCallback((next: SetupPhase) => {
    try { localStorage.setItem(SETUP_KEY, next); } catch { /* Session state still works. */ }
    setPhase(next);
  }, []);
  const completeNotifications = useCallback(() => go("done"), [go]);

  useEffect(() => {
    if (!ready || initialized.current) return;
    const frame = requestAnimationFrame(() => {
      initialized.current = true;
      let stored: string | null = null;
      try { stored = localStorage.getItem(SETUP_KEY); } catch { /* Optional storage. */ }
      go(initialSetupPhase(stored, !welcome));
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, welcome, go]);

  useEffect(() => {
    if (!ready || phase === null) return;
    const next = nextSetupPhase(phase, active, how.kind === "installed");
    if (next === phase) return;
    const frame = requestAnimationFrame(() => go(next));
    return () => cancelAnimationFrame(frame);
  }, [ready, phase, active, how.kind, go]);

  useEffect(() => {
    const restart = () => go("welcome");
    window.addEventListener(SETUP_RESTART, restart);
    return () => window.removeEventListener(SETUP_RESTART, restart);
  }, [go]);

  const visiblePhase = phase === "welcome" || phase === "install" || phase === "notifications" ? phase : null;
  const open = visiblePhase !== null && !active;
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => heading.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [phase, open]);

  function closeAll() {
    if (welcome) dismiss();
    go("done");
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) closeAll(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
              ? document.activeElement : null;
            heading.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (phase !== "tour" && returnFocus.current?.isConnected) returnFocus.current.focus();
          }}>
          {visiblePhase && <>
            <div className={styles.head}>
              <Dialog.Title ref={heading} tabIndex={-1} className={styles.title}>{TITLES[visiblePhase]}</Dialog.Title>
              <Dialog.Close className={styles.close} aria-label="처음 설정 닫기">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </Dialog.Close>
            </div>
            <ol className={styles.progress} aria-label="처음 설정 순서">
              {([['welcome', '사용 가이드'], ['install', '홈 화면 추가'], ['notifications', '공지 알림']] as const).map(([id, label], index) => (
                <li key={id} aria-current={visiblePhase === id ? "step" : undefined}><span>{index + 1}</span>{label}</li>
              ))}
            </ol>
            <Dialog.Description className={styles.description}>{DESCRIPTIONS[visiblePhase]}</Dialog.Description>
            <div className={styles.body}>
              {visiblePhase === "welcome" && <p>가이드 다음에는 홈 화면 추가와 알림 설정을 도와드릴게요. 모든 단계는 건너뛸 수 있어요.</p>}
              {visiblePhase === "install" && <InstallInstructions how={how} />}
              {visiblePhase === "notifications" && <PushSettings onSubscribed={completeNotifications} />}
            </div>
            <div className={styles.actions}>
              {visiblePhase === "welcome" ? <>
                <button type="button" className={styles.primary} onClick={() => { go("tour"); start(); }}>가이드 시작하기</button>
                <button type="button" className={styles.secondary} onClick={() => { dismiss(); go("install"); }}>가이드 건너뛰기</button>
              </> : <button type="button" className={styles.secondary} onClick={() => go(visiblePhase === "install" ? "notifications" : "done")}>
                {visiblePhase === "install" ? "다음: 알림 설정" : "나중에 할게요"}
              </button>}
            </div>
            <p className={styles.later}>MY에서 언제든 다시 설정할 수 있어요.</p>
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function FirstVisitRestart() {
  return <button type="button" className={styles.restart} onClick={() => window.dispatchEvent(new Event(SETUP_RESTART))}>처음 설정 다시 하기 <span aria-hidden="true">→</span></button>;
}
