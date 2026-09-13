import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatDateKST } from "./date-kst";
import type { AnonPostItem } from "./anon-posts-shared";

export type { AnonPostItem } from "./anon-posts-shared";

interface AnonRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
  is_mine: boolean;
}

function toItem(r: AnonRow): AnonPostItem {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    date: formatDateKST(r.created_at),
    isMine: r.is_mine,
  };
}

/**
 * 익명 글 목록.
 *
 * 표를 직접 읽지 않고 함수로만 읽는다 — 표에는 작성자 칸이 있어서, 부원이
 * 표를 읽을 수 있으면 개발자도구로 누가 썼는지 볼 수 있다.
 *
 * 함수가 아직 없거나(설치 전) 실패해도 커뮤니티 전체가 멈추면 안 되므로
 * 빈 목록으로 넘긴다.
 */
export const getAnonPosts = cache(async (): Promise<AnonPostItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("anon_list_posts");
  if (error || !data) return [];
  return (data as AnonRow[]).map(toItem);
});

export async function findAnonPost(id: string): Promise<AnonPostItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("anon_get_post", { p_id: id });
  const row = (data as AnonRow[] | null)?.[0];
  if (error || !row) return null;
  return toItem(row);
}

/**
 * 작성자 — 관리자에게만 나온다.
 *
 * 관리자가 아니면 데이터베이스 함수가 빈 결과를 돌려주므로 null 이다.
 * 화면에서 역할을 한 번 더 보지만, 진짜 문은 데이터베이스에 있다.
 */
export async function findAnonAuthor(id: string): Promise<{ name: string; studentId: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("anon_post_author", { p_id: id });
  const row = (data as { name: string; student_id: string }[] | null)?.[0];
  if (error || !row) return null;
  return { name: row.name, studentId: row.student_id };
}
