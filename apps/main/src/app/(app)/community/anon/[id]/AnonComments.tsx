"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { notifyAnonComment } from "@/app/actions/push";
import { ANON_COMMENT_MAX, type AnonCommentItem } from "@/lib/anon-posts-shared";
import styles from "../anon.module.css";

/**
 * 익명 댓글.
 *
 * 이름표(익명(글쓴이) · 익명1 …)는 데이터베이스가 정해서 준다. 여기서 매기면
 * 누가 몇 번째인지 알려고 작성자를 브라우저에 넘겨야 한다.
 */
export function AnonComments({
  postId,
  comments,
  canModerate,
}: {
  postId: string;
  comments: AnonCommentItem[];
  /** 운영진·관리자 — 남의 댓글도 지운다 */
  canModerate: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || !body.trim()) return;
    setBusy(true);
    setError(null);

    const { data: newId, error: rpcError } = await supabase.rpc("anon_create_comment", {
      p_post_id: postId,
      p_body: body.trim(),
    });

    setBusy(false);
    if (rpcError) {
      setError("댓글을 올리지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    // 글쓴이 휴대폰 알림 — 기다리지 않는다. 안 가도 댓글은 올라가 있다
    if (typeof newId === "string") void notifyAnonComment(newId);
    setBody("");
    router.refresh();
  }

  async function remove(id: string) {
    if (removing) return;
    if (!window.confirm("이 댓글을 지울까요?")) return;

    setRemoving(id);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("anon_delete_comment", { p_id: id });
    setRemoving(null);

    if (rpcError || data !== true) {
      setError("댓글을 지우지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    router.refresh();
  }

  return (
    <section className={styles.comments}>
      <h2 className={styles.commentsTitle}>
        댓글 <span className={styles.commentsCount}>{comments.length}</span>
      </h2>

      {comments.length > 0 ? (
        <ul className={styles.commentList}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <div className={styles.commentHead}>
                <span
                  className={cn(
                    styles.commentLabel,
                    c.label === "익명(글쓴이)" && styles.commentWriter,
                  )}
                >
                  {c.label}
                </span>
                {c.authorName && <span className={styles.commentAuthor}>{c.authorName}</span>}
                <span className={styles.commentDate}>{c.date}</span>
                {(c.isMine || canModerate) && (
                  <button
                    type="button"
                    className={styles.commentRemove}
                    onClick={() => remove(c.id)}
                    disabled={removing === c.id}
                  >
                    {removing === c.id ? "지우는 중…" : "삭제"}
                  </button>
                )}
              </div>
              <p className={styles.commentBody}>{c.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.commentEmpty}>아직 댓글이 없어요.</p>
      )}

      <div className={styles.commentForm}>
        <textarea
          className={styles.commentInput}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={ANON_COMMENT_MAX}
          rows={2}
          placeholder="익명으로 댓글 달기"
        />
        <button
          type="button"
          className={styles.commentSubmit}
          onClick={submit}
          disabled={busy || !body.trim()}
        >
          {busy ? "올리는 중…" : "등록"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
