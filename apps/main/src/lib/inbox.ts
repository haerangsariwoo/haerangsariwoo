/**
 * 쪽지함 — 운영진이 보낸 알림 수신함.
 * 문의는 채널톡 익명 대화로 연결한다 (브리핑 8-5).
 * Supabase 연동 시 messages 테이블로 대체한다.
 */

export type MessageKind = "공지" | "봉사" | "활동" | "승인";

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

export const inboxMessages: InboxMessage[] = [
  {
    id: "im1",
    kind: "승인",
    title: "봉사시간이 반영됐어요",
    body: "여름 집중 봉사 8시간이 승인되어 마이페이지에 반영됐습니다.",
    sentAt: "08.22 14:20",
    read: false,
    href: "/my/records",
  },
  {
    id: "im2",
    kind: "봉사",
    title: "성북천 플로깅 신청이 확정됐어요",
    body: "8월 29일(토) 09:00 성북천 분수마루 앞에서 만나요. 편한 운동화를 준비해 주세요.",
    sentAt: "08.21 19:05",
    read: false,
    href: "/volunteer/v1",
  },
  {
    id: "im3",
    kind: "활동",
    title: "MT 조 편성이 공개됐어요",
    body: "제26회 MT 조 편성이 발행되었습니다. 홈 화면에서 내 조를 확인해 주세요.",
    sentAt: "08.20 21:40",
    read: true,
    href: "/my/team",
  },
  {
    id: "im4",
    kind: "공지",
    title: "2학기 정기총회 참석 안내",
    body: "8월 22일(금) 18:30 미래관 401호에서 정기총회가 열립니다. 전 부원 참석 부탁드려요.",
    sentAt: "08.18 10:00",
    read: true,
    href: "/community/notice/n1",
  },
];

export const unreadCount = inboxMessages.filter((m) => !m.read).length;
