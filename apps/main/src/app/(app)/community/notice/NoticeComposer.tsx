"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { NOTICE_CATEGORIES, toParagraphs, type NoticeCategory } from "@/lib/notices-shared";
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

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setBusy(true);
    setError(null);

    const fields = { category, title: title.trim(), body: toParagraphs(body), pinned };

    if (notice) {
      const { error: updateError } = await supabase
        .from("notices")
        .update(fields)
        .eq("id", notice.id);
      if (updateError) {
        setBusy(false);
        setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      router.replace(`/community/notice/${notice.id}`);
      router.refresh();
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("로그인이 필요합니다. 다시 로그인해 주세요.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("notices")
      .insert({ ...fields, author_id: user.id })
      .select("id")
      .single();
    if (insertError || !data) {
      setBusy(false);
      setError("올리지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    router.replace(`/community/notice/${(data as { id: string }).id}`);
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

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.publish}
          onClick={save}
          disabled={busy || !title.trim() || !body.trim()}
        >
          {busy ? "저장하는 중…" : isEdit ? "저장" : "올리기"}
        </button>
      </div>
    </div>
  );
}
