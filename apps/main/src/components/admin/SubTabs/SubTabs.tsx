"use client";

import { cn } from "@/lib/cn";
import styles from "./SubTabs.module.css";

export interface SubTab {
  value: string;
  label: string;
}

/**
 * 한 메뉴 안에서 성격이 가까운 화면들을 오가는 탭.
 * 왼쪽 메뉴를 짧게 유지하려고 묶은 것이라, 탭 자체가 어떤 화면들이
 * 한 묶음인지 알려주는 역할도 한다.
 */
export function SubTabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: SubTab[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className={styles.bar} role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          className={cn(styles.tab, value === t.value && styles.on)}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
