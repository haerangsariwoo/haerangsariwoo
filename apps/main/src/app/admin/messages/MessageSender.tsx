"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { formatSentAt, MESSAGE_KINDS, type MessageKind } from "@/lib/inbox-shared";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

const KIND_TONE: Record<MessageKind, "blue" | "green" | "orange" | "purple"> = {
  공지: "orange",
  봉사: "green",
  활동: "blue",
  승인: "purple",
};

/**
 * 발송 한 번이 한 줄. inbox_message_batches 뷰가 DB 에서 묶어 준다 —
 * 받는 사람마다 행이 하나씩 생기므로(각자 읽음 표시를 가져야 한다)
 * 화면에서 묶으려면 전 행을 가져와야 하고, 부원이 늘수록 그게 깨진다.
 */
interface BatchRow {
  kind: MessageKind;
  title: string;
  body: string;
  sent_at: string;
  total: number;
  read_count: number;
}

interface SentGroup {
  key: string;
  kind: MessageKind;
  title: string;
  body: string;
  sentAt: string;
  /** 회수할 때 그 발송의 행들을 다시 찾는 기준 */
  rawSentAt: string;
  total: number;
  read: number;
}

/** 최근 이 개수만큼의 "발송" 을 보여준다 — 받는 사람 수와 무관하다 */
const BATCH_LIMIT = 200;

function toGroup(r: BatchRow): SentGroup {
  return {
    key: `${r.kind}|${r.title}|${r.sent_at}`,
    kind: r.kind,
    title: r.title,
    body: r.body,
    sentAt: formatSentAt(r.sent_at),
    rawSentAt: r.sent_at,
    total: r.total,
    read: r.read_count,
  };
}

const EMPTY = { kind: "공지" as MessageKind, title: "", body: "", href: "" };

/**
 * 운영진이 직접 보내는 공지성 쪽지.
 * 승인·참여확정·증빙 결과 쪽지는 DB 트리거가 알아서 만들기 때문에
 * 여기서는 "그 밖에 알릴 것" 만 다룬다.
 *
 * 받는 사람 수만큼 행을 따로 만든다 — 한 줄로 모아 두면 한 사람이
 * 읽었을 때 모두가 읽은 것으로 바뀐다.
 */
export function MessageSender() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [groups, setGroups] = useState<SentGroup[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error: fetchError }, { count }] = await Promise.all([
        supabase
          .from("inbox_message_batches")
          .select("kind, title, body, sent_at, total, read_count")
          .order("sent_at", { ascending: false })
          .limit(BATCH_LIMIT),
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),
      ]);
      if (cancelled) return;
      if (fetchError) setError("보낸 쪽지를 불러오지 못했습니다.");
      else setGroups(((data ?? []) as BatchRow[]).map(toGroup));
      setMemberCount(count ?? 0);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    const { data: members, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("status", "approved");

    if (memberError || !members || members.length === 0) {
      setBusy(false);
      setError("받을 부원을 찾지 못했습니다.");
      return;
    }

    const sentAt = new Date().toISOString();
    const payload = (members as { id: string }[]).map((m) => ({
      member_id: m.id,
      kind: form.kind,
      title: form.title.trim(),
      body: form.body.trim(),
      href: form.href.trim() || null,
      sent_at: sentAt,
    }));

    const { error: insertError } = await supabase.from("inbox_messages").insert(payload);
    setBusy(false);

    if (insertError) {
      setError("쪽지를 보내지 못했습니다.");
      return;
    }

    setGroups((prev) => [
      toGroup({
        kind: form.kind,
        title: form.title.trim(),
        body: form.body.trim(),
        sent_at: sentAt,
        total: payload.length,
        read_count: 0,
      }),
      ...prev,
    ]);
    setResult(`부원 ${payload.length}명에게 보냈습니다.`);
    setForm(EMPTY);
    setOpen(false);
  }

  async function recall(group: SentGroup) {
    if (!window.confirm(`"${group.title}" 쪽지를 회수할까요? 부원 쪽지함에서 사라집니다.`)) return;
    const prev = groups;
    setGroups((cur) => cur.filter((g) => g.key !== group.key));
    // 그 발송으로 만들어진 행 전부 — 보낸 시각이 발송마다 하나뿐이라 이걸로 특정된다
    const { error: deleteError } = await supabase
      .from("inbox_messages")
      .delete()
      .eq("kind", group.kind)
      .eq("title", group.title)
      .eq("sent_at", group.rawSentAt);
    if (deleteError) {
      setGroups(prev);
      setError("회수하지 못했습니다.");
    }
  }

  const canSubmit = form.title.trim() && form.body.trim() && !busy;

  return (
    <Panel
      title="쪽지 보내기"
      desc="부원 쪽지함으로 안내를 보냅니다. 가입 승인·참여확정·증빙 결과 쪽지는 자동으로 나가니 여기서 보내지 않아도 됩니다."
    >
      {error && <p className={tableStyles.muted}>{error}</p>}
      {result && <p className={tableStyles.muted}>{result}</p>}

      <div className={toolbar.toolbar}>
        <span className={tableStyles.muted}>받는 사람: 승인된 부원 {memberCount}명</span>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => setOpen((o) => !o)}
          disabled={readOnly && !open}
        >
          {open ? "닫기" : "＋ 쪽지 작성"}
        </button>
      </div>

      {open && (
        <form className={styles.createForm} onSubmit={send}>
          <div className={styles.formRow}>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>분류</span>
              <select
                className={styles.input}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as MessageKind })}
              >
                {MESSAGE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>제목</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 회비 납부 안내"
                required
              />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.label}>내용</span>
            <textarea
              className={styles.input}
              rows={3}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="부원에게 전할 내용을 적어주세요."
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>바로가기 주소 (선택)</span>
            <input
              className={styles.input}
              value={form.href}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
              placeholder="예: /community"
            />
          </label>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={cn(toolbar.button, toolbar.primary)}
              disabled={!canSubmit}
            >
              {busy ? "보내는 중…" : `${memberCount}명에게 보내기`}
            </button>
            <button type="button" className={toolbar.button} onClick={() => setOpen(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={["분류", "제목", "보낸 시각", "읽음", ""]}
        isEmpty={!loading && groups.length === 0}
        empty={loading ? "불러오는 중..." : "보낸 쪽지가 없습니다."}
      >
        {groups.map((g) => (
          <tr key={g.key}>
            <td>
              <Badge tone={KIND_TONE[g.kind]}>{g.kind}</Badge>
            </td>
            <td>{g.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{g.sentAt}</td>
            <td className={tableStyles.numeric}>
              {g.read} / {g.total}
            </td>
            <td className={styles.rowActions}>
              <RowAction onClick={() => recall(g)} disabled={readOnly}>
                회수
              </RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
