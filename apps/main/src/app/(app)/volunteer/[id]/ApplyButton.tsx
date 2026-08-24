"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import styles from "./detail.module.css";

/**
 * 신청하기. 실제 신청 처리는 Supabase 연동 후 붙는다 — 지금은 눌렀을 때
 * 신청됐다는 상태만 화면에 남겨서, 눌러도 아무 반응이 없다는 인상을 없앤다.
 */
export function ApplyButton({ label }: { label: string }) {
  const [applied, setApplied] = useState(false);

  if (applied) {
    return (
      <Button variant="outline" size="lg" fullWidth disabled>
        신청 완료 · 승인 대기 중
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      className={cn(styles.applyBtn)}
      onClick={() => setApplied(true)}
    >
      {label}
    </Button>
  );
}
