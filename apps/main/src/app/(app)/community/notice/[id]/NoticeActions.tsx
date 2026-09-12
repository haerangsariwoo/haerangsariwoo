"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./notice.module.css";

/**
 * 운영진만 보는 자리. 앨범 게시글과 같은 모양으로 글 아래에 둔다 —
 * 읽으러 온 부원의 눈에는 없는 듯해야 한다.
 */
export function NoticeActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (busy) return;
    if (!window.confirm(`"${title}" 공지를 지울까요?`)) return;

    setBusy(true);
    setError(null);
    const { error: deleteError } = await supabase.from("notices").delete().eq("id", id);
    if (deleteError) {
      setBusy(false);
      setError("지우지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    router.replace("/community");
    router.refresh();
  }

  return (
    <>
      <div className={styles.postActions}>
        <Link href={`/community/notice/${id}/edit`} className={styles.postEdit}>
          수정하기
        </Link>
        <button type="button" className={styles.postRemove} onClick={remove} disabled={busy}>
          {busy ? "지우는 중…" : "공지 지우기"}
        </button>
      </div>
      {error && <p className={styles.actionError}>{error}</p>}
    </>
  );
}
