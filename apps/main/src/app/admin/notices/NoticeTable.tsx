"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { NoticeComposer, type NoticeDraft } from "@/components/admin/NoticeComposer/NoticeComposer";
import type { NoticeItem } from "@/lib/notices";
import { useSemester } from "../SemesterContext";
import styles from "../volunteers/volunteers.module.css";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

interface NoticeRow {
  id: string;
  category: NoticeItem["category"];
  title: string;
  body: string[];
  pinned: boolean;
  created_at: string;
  author: { name: string } | null;
}

const SELECT = "id, category, title, body, pinned, created_at, author:members(name)";

function toItem(r: NoticeRow): NoticeItem {
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    body: r.body,
    pinned: r.pinned,
    date: formatDate(r.created_at),
    author: `${r.author?.name ?? "운영진"} 운영진`,
  };
}

export function NoticeTable() {
  const { readOnly, matches } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** 수정 중인 공지 — 작성 폼을 그대로 재사용한다 */
  const [editing, setEditing] = useState<(NoticeDraft & { id: string }) | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("notices")
        .select(SELECT)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError("공지를 불러오지 못했습니다.");
      } else {
        setRows(((data ?? []) as unknown as NoticeRow[]).map(toItem));
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function togglePin(id: string, next: boolean) {
    const prev = rows;
    setRows((cur) => cur.map((n) => (n.id === id ? { ...n, pinned: next } : n)));
    const { error: updateError } = await supabase.from("notices").update({ pinned: next }).eq("id", id);
    if (updateError) {
      setRows(prev);
      setError("고정 상태를 바꾸지 못했습니다. 다시 시도해 주세요.");
    }
  }

  async function remove(id: string) {
    const prev = rows;
    setRows((cur) => cur.filter((n) => n.id !== id));
    const { error: deleteError } = await supabase.from("notices").delete().eq("id", id);
    if (deleteError) {
      setRows(prev);
      setError("삭제하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  /** 새 공지를 등록하고, 등록된 공지의 id 를 돌려준다 — 작성 폼이 이 id로 푸시를 보낸다 */
  async function add(notice: {
    title: string;
    body: string;
    category: string;
    pinned: boolean;
  }): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      return null;
    }

    const { data, error: insertError } = await supabase
      .from("notices")
      .insert({
        category: notice.category,
        title: notice.title,
        body: [notice.body],
        pinned: notice.pinned,
        author_id: user.id,
      })
      .select(SELECT)
      .single();

    if (insertError || !data) {
      setError("공지 등록에 실패했습니다. 다시 시도해 주세요.");
      return null;
    }

    const item = toItem(data as unknown as NoticeRow);
    setRows((prev) => [item, ...prev]);
    return item.id;
  }

  async function update(id: string, draft: NoticeDraft) {
    const prev = rows;
    setRows((cur) =>
      cur.map((n) =>
        n.id === id
          ? { ...n, title: draft.title, category: draft.category as NoticeItem["category"], body: [draft.body], pinned: draft.pinned }
          : n,
      ),
    );
    const { error: updateError } = await supabase
      .from("notices")
      .update({
        title: draft.title,
        category: draft.category,
        body: [draft.body],
        pinned: draft.pinned,
      })
      .eq("id", id);
    if (updateError) {
      setRows(prev);
      setError("수정하지 못했습니다. 다시 시도해 주세요.");
      return false;
    }
    setEditing(null);
    return true;
  }

  // 고정된 공지를 위로
  const sorted = [...rows]
    .filter((n) => matches(n.date))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <Panel
      title="공지·알림"
      count={`${rows.length}건`}
      desc="부원 커뮤니티에 노출되는 공지입니다."
    >
      {error && <p className={tableStyles.muted}>{error}</p>}

      <NoticeComposer
        onCreate={add}
        editing={editing}
        onUpdate={update}
        onCancelEdit={() => setEditing(null)}
        disabled={readOnly}
      />

      <DataTable
        columns={["카테고리", "제목", "작성자", "작성일", "상단 고정", ""]}
        isEmpty={!loading && sorted.length === 0}
        empty={loading ? "불러오는 중..." : "등록된 공지가 없습니다."}
      >
        {sorted.map((n) => (
          <tr key={n.id}>
            <td>
              <Badge tone={n.category === "필독" ? "orange" : "blue"}>{n.category}</Badge>
            </td>
            <td>{n.title}</td>
            <td className={tableStyles.muted}>{n.author}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{n.date}</td>
            <td>
              {n.pinned ? (
                <Badge tone="green">고정</Badge>
              ) : (
                <span className={tableStyles.muted}>—</span>
              )}
            </td>
            <td className={styles.rowActions}>
              <RowAction
                onClick={() => togglePin(n.id, !n.pinned)}
                title={n.pinned ? "상단 고정 해제" : "상단에 고정"}
                disabled={readOnly}
              >
                {n.pinned ? "고정 해제" : "고정"}
              </RowAction>
              <RowAction
                onClick={() =>
                  setEditing({
                    id: n.id,
                    title: n.title,
                    category: n.category,
                    body: n.body.join("\n"),
                    pinned: n.pinned,
                  })
                }
                disabled={readOnly}
              >
                수정
              </RowAction>
              <RowAction onClick={() => remove(n.id)} disabled={readOnly}>
                삭제
              </RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
