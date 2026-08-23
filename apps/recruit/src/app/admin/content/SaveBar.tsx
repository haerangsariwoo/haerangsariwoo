"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { ui } from "@/components/admin/Panel";
import styles from "@/components/admin/ContentEditor.module.css";

/**
 * 각 패널의 저장 줄.
 * 실제 저장은 Supabase 연동 후. 지금은 눌렀다는 것만 알려준다.
 */
export function SaveBar({ note }: { note: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className={styles.saveBar}>
      <p className={styles.saveNote}>{saved ? "저장했습니다." : note}</p>
      <button
        type="button"
        className={cn(ui.btn, ui.primary)}
        onClick={() => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2400);
        }}
      >
        저장
      </button>
    </div>
  );
}
