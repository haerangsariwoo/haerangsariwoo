"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import type { AttendState } from "@/lib/activities";
import styles from "./detail.module.css";

const OPTIONS: AttendState[] = ["참석", "미정", "불참"];

export function AttendPicker({
  activityId,
  initial,
}: {
  activityId: string;
  initial: AttendState | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<AttendState | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(next: AttendState) {
    if (busy || next === value) return;
    const prev = value;
    setValue(next);
    setBusy(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setValue(prev);
      setBusy(false);
      setError("로그인이 필요해요.");
      return;
    }

    // 한 활동에 한 사람당 한 줄 — 다시 고르면 그 줄을 덮어쓴다
    const { error: saveError } = await supabase.from("activity_rsvps").upsert(
      { activity_id: activityId, member_id: user.id, state: next, updated_at: new Date().toISOString() },
      { onConflict: "activity_id,member_id" },
    );

    if (saveError) {
      setValue(prev);
      setError("응답을 저장하지 못했어요. 다시 시도해 주세요.");
    }
    setBusy(false);
  }

  return (
    <>
      <div className={styles.attendPicker} role="group" aria-label="참석 여부 선택">
        {OPTIONS.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            disabled={busy}
            className={cn(
              styles.attendBtn,
              value === o && (o === "불참" ? styles.selectedDanger : styles.selected),
            )}
            onClick={() => choose(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {error && <p className={styles.body}>{error}</p>}
    </>
  );
}
