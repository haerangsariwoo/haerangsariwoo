"use client";

import { useEffect } from "react";
import Image from "next/image";
import { mountSplash } from "@/lib/app-splash";
import styles from "./AppSplash.module.css";

export function AppSplash() {
  useEffect(mountSplash, []);

  return (
    <div className={styles.splash} data-app-splash-screen aria-hidden="true">
      <div className={styles.signature}>
        <Image
          data-app-splash-image
          className={styles.dolphin}
          src="/brand/dolphin-hello.webp"
          width={144}
          height={144}
          unoptimized
          loading="eager"
          fetchPriority="high"
          alt=""
        />
        <p className={styles.name}>해랑사리우</p>
      </div>
      <p className={styles.footer}>한성대학교 봉사동아리</p>
    </div>
  );
}
