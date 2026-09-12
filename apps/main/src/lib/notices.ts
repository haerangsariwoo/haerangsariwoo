import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { NoticeCategory } from "./notices-shared";

export type { NoticeCategory } from "./notices-shared";

export interface NoticeItem {
  id: string;
  category: NoticeCategory;
  title: string;
  /** 고친 적이 있으면 고친 날, 없으면 올린 날 */
  date: string;
  /** 고친 적이 있으면 고친 사람, 없으면 올린 사람 */
  author: string;
  pinned: boolean;
  body: string[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

interface NoticeRow {
  id: string;
  category: NoticeCategory;
  title: string;
  body: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string | null;
  author: { name: string } | null;
  editor: { name: string } | null;
}

export const getNotices = cache(async (): Promise<NoticeItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    // members 로 가는 길이 둘(작성자·수정자)이라 어느 쪽인지 짚어줘야 한다
    .select(
      "id, category, title, body, pinned, created_at, updated_at, author:members!notices_author_id_fkey(name), editor:members!notices_updated_by_fkey(name)",
    );

  const rows = ((data ?? []) as unknown as NoticeRow[]).map((n) => {
    // 고친 적이 있으면 그쪽을 보여준다 — 보는 사람에게는 지금 기준이 중요하다
    const at = n.updated_at ?? n.created_at;
    const who = (n.updated_at ? n.editor?.name : n.author?.name) ?? "운영진";
    return {
      id: n.id,
      category: n.category,
      title: n.title,
      body: n.body,
      pinned: n.pinned,
      date: formatDate(at),
      author: `${who} 운영진`,
      at,
    };
  });

  /*
   * 고정을 위로, 그다음은 화면에 적힌 날짜가 최근인 것부터.
   *
   * DB 에 시키지 않고 여기서 세우는 이유는, 고친 날과 올린 날 중 화면에
   * 쓰는 쪽으로 세워야 하기 때문이다. 위에 있는 공지가 아래 것보다 날짜가
   * 옛날이면 읽는 사람이 차례를 의심한다.
   */
  rows.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.localeCompare(a.at));

  // at 은 차례를 세우는 데만 쓰고 화면에는 내보내지 않는다
  return rows.map((n) => ({
    id: n.id,
    category: n.category,
    title: n.title,
    body: n.body,
    pinned: n.pinned,
    date: n.date,
    author: n.author,
  }));
});

export async function findNotice(id: string) {
  const rows = await getNotices();
  return rows.find((n) => n.id === id) ?? null;
}
