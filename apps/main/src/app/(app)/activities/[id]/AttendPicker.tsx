"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AttendState } from "@/lib/activities";
import styles from "./detail.module.css";

const OPTIONS: AttendState[] = ["참석", "미정", "불참"];

export function AttendPicker({ initial }: { initial: AttendState | null }) {
  const [value, setValue] = useState<AttendState | null>(initial);

  return (
    <div className={styles.attendPicker} role="group" aria-label="참석 여부 선택">
      {OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          className={cn(
            styles.attendBtn,
            value === o && (o === "불참" ? styles.selectedDanger : styles.selected),
          )}
          onClick={() => setValue(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
