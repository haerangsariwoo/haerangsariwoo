"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { ui } from "@/components/admin/Panel";
import styles from "@/components/admin/ContentEditor.module.css";

/**
 * 각 패널의 저장 줄. onSave 를 주면 실제로 localStorage 에 반영한다
 * (Supabase 연동 전 임시 저장소, [[content-store]] 참고). 주지 않으면
 * 예전처럼 눌렀다는 표시만 한다.
 */
export function SaveBar({ note, onSave }: { note: string; onSave?: () => void }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className={styles.saveBar}>
      <p className={styles.saveNote}>{saved ? "저장했습니다." : note}</p>
      <button
        type="button"
        className={cn(ui.btn, ui.primary)}
        onClick={() => {
          onSave?.();
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2400);
        }}
      >
        저장
      </button>
    </div>
  );
}
