import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type NoticeCategory = "필독" | "일정" | "후기" | "MT";

export interface NoticeItem {
  id: string;
  category: NoticeCategory;
  title: string;
  date: string;
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
  author: { name: string } | null;
}

export const getNotices = cache(async (): Promise<NoticeItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("id, category, title, body, pinned, created_at, author:members(name)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as NoticeRow[]).map((n) => ({
    id: n.id,
    category: n.category,
    title: n.title,
    body: n.body,
    pinned: n.pinned,
    date: formatDate(n.created_at),
    author: `${n.author?.name ?? "운영진"} 운영진`,
  }));
});

export async function findNotice(id: string) {
  const rows = await getNotices();
  return rows.find((n) => n.id === id) ?? null;
}
