"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { sendNoticePush } from "@/app/actions/push";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./NoticeComposer.module.css";

const CATEGORIES = ["필독", "일정", "후기", "MT"] as const;

export interface NoticeDraft {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
}

interface NoticeComposerProps {
  /** 공지를 등록하고, 등록된 공지의 id를 돌려준다 — 실패하면 null */
  onCreate?: (n: NoticeDraft) => Promise<string | null>;
  /** 수정 중인 공지. 주어지면 폼이 그 내용으로 열리고 저장은 수정이 된다 */
  editing?: (NoticeDraft & { id: string }) | null;
  onUpdate?: (id: string, n: NoticeDraft) => Promise<boolean>;
  onCancelEdit?: () => void;
  /** 지난 학기를 보는 중이면 새 공지를 못 쓰게 막는다 — 실제로 푸시 알림까지 나가는 동작이라 열기 전에 막는다 */
  disabled?: boolean;
}

export function NoticeComposer({
  onCreate,
  editing,
  onUpdate,
  onCancelEdit,
  disabled,
}: NoticeComposerProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [push, setPush] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function reset() {
    setTitle("");
    setBody("");
    setPinned(false);
  }

  // 수정 버튼을 누르면 그 공지 내용으로 폼을 채워 연다.
  // effect 대신 렌더 중에 맞추는 편이 낫다 — 폼이 빈 채로 한 번 그려졌다가
  // 값이 채워지며 다시 그리는 깜빡임이 없다.
  const [filledFor, setFilledFor] = useState<string | null>(null);
  if (editing && editing.id !== filledFor) {
    setFilledFor(editing.id);
    setTitle(editing.title);
    setBody(editing.body);
    setCategory(editing.category);
    setPinned(editing.pinned);
    setPush(false);
    setOpen(true);
    setResult(null);
  }
  if (!editing && filledFor !== null) setFilledFor(null);

  function close() {
    setOpen(false);
    setResult(null);
    reset();
    onCancelEdit?.();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);

    const draft = { title: title.trim(), body: body.trim(), category, pinned };

    if (editing) {
      const ok = await onUpdate?.(editing.id, draft);
      setBusy(false);
      if (!ok) {
        setResult({ ok: false, text: "수정하지 못했습니다." });
        return;
      }
      setResult({ ok: true, text: "수정했습니다." });
      close();
      return;
    }

    const noticeId = await onCreate?.(draft);
    if (!noticeId) {
      setResult({ ok: false, text: "공지 등록에 실패했습니다." });
      setBusy(false);
      return;
    }

    if (!push) {
      setResult({ ok: true, text: "공지를 등록했습니다. (알림은 보내지 않음)" });
      reset();
      setBusy(false);
      return;
    }

    const res = await sendNoticePush({ title, body, noticeId });
    if (res.ok) {
      const failNote = res.failed ? ` (실패 ${res.failed}건)` : "";
      setResult({ ok: true, text: `공지를 등록하고 알림 ${res.sent}건을 보냈습니다.${failNote}` });
      reset();
    } else {
      setResult({ ok: false, text: `공지는 등록됐지만 알림 발송에 실패했습니다 — ${res.error}` });
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="제목 검색" aria-label="공지 검색" />
        <select className={toolbar.select} defaultValue="all" aria-label="카테고리 필터">
          <option value="all">카테고리: 전체</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          ＋ 공지 작성
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.row}>
          <div className={cn(styles.field, styles.narrow)}>
            <label className={styles.label} htmlFor="notice-category">
              카테고리
            </label>
            <select
              id="notice-category"
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="notice-title">
              제목
            </label>
            <input
              id="notice-title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2학기 정기총회 참석 안내"
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="notice-body">
            내용
          </label>
          <textarea
            id="notice-body"
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="부원들에게 전할 내용을 적어주세요."
            required
          />
        </div>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          <span className={styles.checkBody}>
            <span className={styles.checkLabel}>상단 고정</span>
            <span className={styles.checkHint}>커뮤니티 공지 목록 맨 위에 노출됩니다.</span>
          </span>
        </label>

        <label className={cn(styles.checkRow, editing && styles.hidden)}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={push}
            onChange={(e) => setPush(e.target.checked)}
          />
          <span className={styles.checkBody}>
            <span className={styles.checkLabel}>부원들에게 푸시 알림 보내기</span>
            <span className={styles.checkHint}>
              알림을 켠 부원의 휴대폰으로 바로 전송됩니다. 알림을 누르면 이 공지로 이동해요.
            </span>
          </span>
        </label>

        <div className={styles.actions}>
          <button type="submit" className={cn(toolbar.button, toolbar.primary)} disabled={busy}>
            {busy ? "저장 중…" : editing ? "수정 저장" : "공지 등록"}
          </button>
          <button
            type="button"
            className={toolbar.button}
            onClick={close}
          >
            닫기
          </button>
          {result && (
            <span className={cn(styles.result, result.ok ? styles.ok : styles.fail)}>
              {result.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
