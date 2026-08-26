/**
 * 쪽지함에서 서버 조회와 화면(클라이언트)이 같이 쓰는 값들.
 * lib/inbox.ts 는 서버 전용이라 여기서 갈라 둔다.
 */

export type MessageKind = "공지" | "봉사" | "활동" | "승인";

export const MESSAGE_KINDS: MessageKind[] = ["공지", "봉사", "활동", "승인"];

export interface InboxMessage {
  id: string;
  kind: MessageKind;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
  /** 관련 화면으로 이동 */
  href?: string;
}

export interface InboxRow {
  id: string;
  kind: MessageKind;
  title: string;
  body: string;
  href: string | null;
  is_read: boolean;
  sent_at: string;
}

/** "08.22 14:20" — 쪽지함은 올해 온 것만 보므로 연도는 뺀다 */
export function formatSentAt(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function toMessage(r: InboxRow): InboxMessage {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    sentAt: formatSentAt(r.sent_at),
    read: r.is_read,
    href: r.href ?? undefined,
  };
}
