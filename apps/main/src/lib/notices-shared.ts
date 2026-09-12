/**
 * 공지에서 서버와 브라우저가 함께 쓰는 것들.
 *
 * notices.ts 는 서버 전용(next/headers)을 끌고 와서 쓰기 화면이 import 할
 * 수 없다. 양쪽이 같이 쓰는 값은 여기 둔다.
 */

export type NoticeCategory = "필독" | "일정" | "후기" | "MT";

export const NOTICE_CATEGORIES: readonly NoticeCategory[] = ["필독", "일정", "후기", "MT"];

export function toNoticeCategory(value: string | null | undefined): NoticeCategory {
  return NOTICE_CATEGORIES.includes(value as NoticeCategory)
    ? (value as NoticeCategory)
    : NOTICE_CATEGORIES[0];
}

/**
 * 쓴 글을 문단으로 나눈다.
 *
 * 본문은 문단 하나가 배열의 한 칸이고, 보는 화면이 칸마다 사이를 띄운다.
 * 빈 줄을 문단의 경계로 보고, 문단 안의 줄바꿈은 그대로 둔다 — 목록을
 * 줄줄이 적었는데 줄마다 뚝뚝 떨어지면 읽기 어렵다.
 */
export function toParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
