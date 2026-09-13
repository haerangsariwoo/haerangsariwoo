/**
 * 익명 글에서 서버와 브라우저가 함께 쓰는 것들.
 *
 * 작성자 칸은 여기에 없다 — 데이터베이스 함수가 애초에 돌려주지 않는다.
 * 브라우저가 받는 건 "내 글인가" 뿐이다.
 */
export interface AnonPostItem {
  id: string;
  title: string;
  body: string;
  /** "2026.09.13" — 시각은 적지 않는다. 몇 시에 썼는지로 누구인지 짐작할 수 있다 */
  date: string;
  isMine: boolean;
  commentCount: number;
}

export interface AnonCommentItem {
  id: string;
  /** "익명(글쓴이)" 또는 "익명1" … — 데이터베이스가 붙여서 준다 */
  label: string;
  body: string;
  date: string;
  isMine: boolean;
  /** 관리자에게만 채워진다 */
  authorName: string | null;
}

export const ANON_TITLE_MAX = 60;
export const ANON_BODY_MAX = 2000;
export const ANON_COMMENT_MAX = 500;
