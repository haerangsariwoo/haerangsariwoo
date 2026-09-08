"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ALBUM_BUCKET, type Album } from "@/lib/community";
import styles from "./album.module.css";

/**
 * 운영진만 보는 자리.
 *
 * 글 아래에 둔다 — 사진과 글을 다 보고 나서야 고치거나 지울 일이 생긴다.
 * 위쪽에 두면 보러 온 사람의 눈에 먼저 걸린다.
 */
export function PostActions({ album }: { album: Album }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (busy) return;
    if (!window.confirm(`"${album.title}" 게시글을 지울까요? 사진도 함께 지워집니다.`)) return;

    setBusy(true);
    setError(null);

    // 사진 파일까지 함께 — 남겨두면 보이지도 않으면서 용량만 먹는다
    const files = album.photos.flatMap((p) =>
      [p.path, p.thumbPath].filter(Boolean) as string[],
    );
    if (files.length > 0) await supabase.storage.from(ALBUM_BUCKET).remove(files);

    const { error: deleteError } = await supabase.from("albums").delete().eq("id", album.id);
    if (deleteError) {
      setBusy(false);
      setError("지우지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    router.replace("/community?tab=앨범");
    router.refresh();
  }

  return (
    <>
      <div className={styles.postActions}>
        <Link href={`/community/album/${album.id}/edit`} className={styles.postEdit}>
          수정하기
        </Link>
        <button type="button" className={styles.postRemove} onClick={remove} disabled={busy}>
          {busy ? "지우는 중…" : "게시글 지우기"}
        </button>
      </div>
      {error && <p className={styles.saveError}>{error}</p>}
    </>
  );
}
