"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { NOTICE_CATEGORIES, toParagraphs, type NoticeCategory } from "@/lib/notices-shared";
import { sendNoticePush } from "@/app/actions/push";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import styles from "./composer.module.css";

/** 고치려고 불러온 공지 */
export interface ComposerNotice {
  id: string;
  category: NoticeCategory;
  title: string;
  body: string[];
  pinned: boolean;
}

/**
 * 공지 쓰기·고치기.
 *
 * 예전에는 관리자 화면까지 들어가야 공지를 올릴 수 있었다. 공지는 자리에서
 * 바로 알려야 할 일이 많아 커뮤니티 안으로 옮겼다. 앨범 게시글과 같은
 * 방식이다 — 운영진은 두 가지를 다른 방법으로 기억할 필요가 없다.
 */
export function NoticeComposer({ notice }: { notice?: ComposerNotice }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isEdit = notice !== undefined;

  const [category, setCategory] = useState<NoticeCategory>(notice?.category ?? NOTICE_CATEGORIES[0]);
  const [title, setTitle] = useState(notice?.title ?? "");
  const [body, setBody] = useState(notice?.body.join("\n\n") ?? "");
  const [pinned, setPinned] = useState(notice?.pinned ?? false);
  // 새로 올릴 때만 묻는다. 고칠 때 다시 울리면 같은 공지로 두 번 깨우는 셈이다
  const [push, setPush] = useState(true);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 공지는 올라갔는데 알림만 실패한 경우 — 여기 갇히지 않게 길을 열어둔다 */
  const [postedId, setPostedId] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    if (!title.trim()) {
      setError("제목을 적어주세요.");
      return;
    }
    if (!body.trim()) {
      setError("내용을 적어주세요.");
      return;
    }

    setBusy("저장하는 중…");
    setError(null);

    const fields = { category, title: title.trim(), body: toParagraphs(body), pinned };

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(null);
      setError("로그인이 필요합니다. 다시 로그인해 주세요.");
      return;
    }

    if (notice) {
      // 고친 사람과 시각을 남긴다 — 화면은 이쪽을 보여준다
      const { error: updateError } = await supabase
        .from("notices")
        .update({ ...fields, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq("id", notice.id);
      if (updateError) {
        setBusy(null);
        setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      router.replace(`/community/notice/${notice.id}`);
      router.refresh();
      return;
    }

    const { data, error: insertError } = await supabase
      .from("notices")
      .insert({ ...fields, author_id: user.id })
      .select("id")
      .single();
    if (insertError || !data) {
      setBusy(null);
      setError("올리지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const noticeId = (data as { id: string }).id;

    /*
     * 알림까지 보내야 공지가 공지 노릇을 한다.
     *
     * 공지는 이미 올라갔으므로 알림이 실패해도 되돌리지 않는다. 대신 조용히
     * 넘기지 않는다 — 보낸 줄 알고 있으면 아무도 못 본 공지가 된다.
     */
    if (push) {
      setBusy("알림 보내는 중…");
      const sent = await sendNoticePush({ title: fields.title, body: fields.body.join(" "), noticeId });
      if (!sent.ok) {
        setBusy(null);
        setPostedId(noticeId);
        setError(`공지는 올라갔지만 알림을 보내지 못했어요 — ${sent.error}`);
        return;
      }
    }

    router.replace(`/community/notice/${noticeId}`);
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community", label: "커뮤니티" }} />
      <h1 className={styles.heading}>{isEdit ? "공지 수정" : "공지 작성"}</h1>

      <div className={styles.field}>
        <span className={styles.label}>분류</span>
        <div className={styles.chips}>
          {NOTICE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(styles.chip, category === c && styles.chipOn)}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>제목</span>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 9월 정기 봉사 안내"
          maxLength={60}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>내용</span>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={"알릴 내용을 적어주세요.\n\n한 줄 띄우면 문단이 나뉩니다."}
          rows={10}
        />
      </label>

      {/* 고정하면 목록 맨 위에 남는다 — 지난 공지에 밀리지 않아야 할 때만 */}
      <label className={styles.pinRow}>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        <span>
          상단 고정
          <span className={styles.pinHint}>목록 맨 위에 계속 보입니다.</span>
        </span>
      </label>

      {/* 고칠 때는 묻지 않는다 — 같은 공지로 두 번 깨우지 않는다 */}
      {!isEdit && (
        <label className={styles.pinRow}>
          <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
          <span>
            알림 보내기
            <span className={styles.pinHint}>
              알림을 켠 부원의 휴대폰으로 바로 갑니다. 누르면 이 공지로 옵니다.
            </span>
          </span>
        </label>
      )}

      {error && (
        <p className={styles.error}>
          {error}
          {postedId && (
            <Link href={`/community/notice/${postedId}`} className={styles.errorLink}>
              올라간 공지 보기
            </Link>
          )}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.publish}
          onClick={save}
          disabled={busy !== null || !title.trim() || !body.trim()}
        >
          {busy ?? (isEdit ? "저장" : "올리기")}
        </button>
      </div>
    </div>
  );
}
