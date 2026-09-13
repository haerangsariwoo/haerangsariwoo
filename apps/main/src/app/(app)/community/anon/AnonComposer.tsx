"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ANON_BODY_MAX, ANON_TITLE_MAX } from "@/lib/anon-posts-shared";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import styles from "./anon.module.css";

/**
 * 익명 글쓰기.
 *
 * 작성자는 브라우저가 넘기지 않는다 — 데이터베이스 함수가 로그인한 사람으로
 * 못박는다. 여기서 넘기게 두면 남의 이름으로 쓸 수 있다.
 */
export function AnonComposer() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = title.trim().length > 0 && body.trim().length > 0;

  async function submit() {
    if (busy || !ready) return;
    setBusy(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("anon_create_post", {
      p_title: title.trim(),
      p_body: body.trim(),
    });

    if (rpcError || !data) {
      setBusy(false);
      setError("올리지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    router.replace(`/community/anon/${data as string}`);
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community?tab=익명", label: "익명 게시판" }} />
      <h1 className={styles.heading}>익명 글쓰기</h1>

      <label className={styles.field}>
        <span className={styles.label}>제목</span>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={ANON_TITLE_MAX}
          placeholder="제목을 적어주세요"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          내용
          <span className={styles.count}>
            {body.length}/{ANON_BODY_MAX}
          </span>
        </span>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={ANON_BODY_MAX}
          rows={10}
          placeholder="하고 싶은 이야기를 적어주세요."
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="button" className={styles.publish} onClick={submit} disabled={busy || !ready}>
        {busy ? "올리는 중…" : "올리기"}
      </button>
    </div>
  );
}
