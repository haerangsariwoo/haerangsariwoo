import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatDateKST } from "./date-kst";
import type { AnonCommentItem, AnonPostItem } from "./anon-posts-shared";

export type { AnonCommentItem, AnonPostItem } from "./anon-posts-shared";

interface AnonRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
  is_mine: boolean;
  /** 목록 함수만 준다. 댓글 기능 설치 전이면 없다 */
  comment_count?: number;
}

function toItem(r: AnonRow): AnonPostItem {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    date: formatDateKST(r.created_at),
    isMine: r.is_mine,
    commentCount: r.comment_count ?? 0,
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

interface CommentRow {
  id: string;
  label: string;
  body: string;
  created_at: string;
  is_mine: boolean;
}

/**
 * 한 글의 댓글. 이름표(익명1 …)는 데이터베이스가 붙여 준다.
 *
 * 관리자면 댓글마다 작성자 이름을 함께 채운다. 관리자가 아니면 이름을 묻는
 * 함수가 빈 결과를 주므로 전부 비어 있다.
 */
export async function getAnonComments(postId: string, asAdmin: boolean): Promise<AnonCommentItem[]> {
  const supabase = await createClient();
  const [{ data, error }, authors] = await Promise.all([
    supabase.rpc("anon_list_comments", { p_post_id: postId }),
    asAdmin
      ? supabase.rpc("anon_comment_authors", { p_post_id: postId })
      : Promise.resolve({ data: null }),
  ]);
  if (error || !data) return [];

  const names = new Map(
    ((authors.data ?? []) as { comment_id: string; name: string }[]).map((a) => [a.comment_id, a.name]),
  );

  return (data as CommentRow[]).map((c) => ({
    id: c.id,
    label: c.label,
    body: c.body,
    date: formatDateKST(c.created_at),
    isMine: c.is_mine,
    authorName: names.get(c.id) ?? null,
  }));
}
