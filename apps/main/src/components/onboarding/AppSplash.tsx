"use client";

import { useEffect } from "react";
import Image from "next/image";
import styles from "./AppSplash.module.css";

export function AppSplash() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.appSplash !== "show") return;
    const dismiss = () => { delete root.dataset.appSplash; };
    // CSS also dismisses without hydration; never wait for video, data or auth.
    const timeout = window.setTimeout(dismiss, 900);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => { if (motion.matches) dismiss(); };
    document.addEventListener("pointerdown", dismiss, { once: true, capture: true });
    document.addEventListener("keydown", dismiss, { once: true, capture: true });
    document.addEventListener("focusin", dismiss, { once: true, capture: true });
    motion.addEventListener("change", onMotion);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("keydown", dismiss, true);
      document.removeEventListener("focusin", dismiss, true);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <div className={styles.splash} data-app-splash-screen aria-hidden="true">
      <div className={styles.signature}>
        <Image className={styles.dolphin} src="/brand/dolphin-hello.webp" width={480} height={480} sizes="144px" alt="" />
        <p className={styles.name}>해랑사리우</p>
      </div>
      <p className={styles.footer}>한성대학교 봉사동아리</p>
    </div>
  );
}
