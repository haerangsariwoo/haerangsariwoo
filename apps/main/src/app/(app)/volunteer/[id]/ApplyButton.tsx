"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import { createClient } from "@/lib/supabase/client";
import styles from "./detail.module.css";

const CANCELABLE = new Set(["신청완료", "대기"]);

export function ApplyButton({
  activityId,
  initialState,
}: {
  activityId: string;
  initialState: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("로그인이 필요합니다.");
      return;
    }
    const { error: insertError } = await supabase
      .from("internal_activity_applications")
      .insert({ activity_id: activityId, member_id: user.id });
    setBusy(false);
    if (insertError) {
      setError("신청 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }
    setState("신청완료");
    router.refresh();
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }
    const { error: deleteError } = await supabase
      .from("internal_activity_applications")
      .delete()
      .eq("activity_id", activityId)
      .eq("member_id", user.id);
    setBusy(false);
    if (deleteError) {
      setError("취소 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }
    setState(null);
    router.refresh();
  }

  if (state && CANCELABLE.has(state)) {
    return (
      <div className={styles.applyGroup}>
        <Button variant="outline" size="lg" fullWidth disabled>
          신청 완료 · 참여 확정 대기 중
        </Button>
        <button type="button" className={styles.cancelLink} onClick={cancel} disabled={busy}>
          신청 취소
        </button>
        {error && <p className={styles.applyError}>{error}</p>}
      </div>
    );
  }

  if (state) {
    return (
      <Button variant="outline" size="lg" fullWidth disabled>
        {state === "참여확정" ? "참여가 확정됐어요" : state}
      </Button>
    );
  }

  return (
    <div className={styles.applyGroup}>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        className={cn(styles.applyBtn)}
        onClick={apply}
        disabled={busy}
      >
        {busy ? "신청 중..." : "신청하기"}
      </Button>
      {error && <p className={styles.applyError}>{error}</p>}
    </div>
  );
}
