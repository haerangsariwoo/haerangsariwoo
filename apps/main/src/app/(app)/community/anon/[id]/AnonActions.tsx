"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../anon.module.css";

/**
 * 지우기 — 쓴 사람 본인이나 운영진에게만 보인다.
 * 화면에서 가려도 데이터베이스 함수가 한 번 더 확인한다.
 */
export function AnonActions({ id }: { id: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (busy) return;
    if (!window.confirm("이 글을 지울까요?")) return;

    setBusy(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("anon_delete_post", { p_id: id });

    // 지워진 행이 없으면 false 가 온다 — 권한이 없었거나 이미 지워진 글이다
    if (rpcError || data !== true) {
      setBusy(false);
      setError("지우지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    router.replace("/community?tab=익명");
    router.refresh();
  }

  return (
    <>
      <div className={styles.actions}>
        <button type="button" className={styles.remove} onClick={remove} disabled={busy}>
          {busy ? "지우는 중…" : "글 지우기"}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
