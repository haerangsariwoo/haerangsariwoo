"use server";

import { pushConfigured, sendToAll, sendToOne } from "@/lib/push/server";
import { removeSubscription, saveSubscription, subscriptionCount } from "@/lib/push/store";

/** 브라우저가 만든 PushSubscription 을 JSON 으로 직렬화한 형태 */
export interface SerializedSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeUser(sub: SerializedSubscription, memberId?: string) {
  saveSubscription({ endpoint: sub.endpoint, keys: sub.keys, memberId });
  return { ok: true as const, count: subscriptionCount() };
}

export async function unsubscribeUser(endpoint: string) {
  removeSubscription(endpoint);
  return { ok: true as const, count: subscriptionCount() };
}

/** 설정 화면의 "테스트 알림 받기" — 요청한 본인 기기로만 보낸다 */
export async function sendTestNotification(endpoint: string) {
  if (!pushConfigured) {
    return { ok: false as const, error: "서버에 VAPID 키가 설정되지 않았습니다." };
  }
  const result = await sendToOne(endpoint, {
    title: "해랑사리우",
    body: "알림이 잘 도착했어요. 이제 공지가 올라오면 바로 알려드릴게요.",
    url: "/messages",
    tag: "haerang-test",
  });
  if (result.sent === 0) {
    return { ok: false as const, error: "이 기기의 구독 정보를 찾지 못했어요. 알림을 껐다 켜주세요." };
  }
  return { ok: true as const, ...result };
}

/** 관리자 공지 등록 시 전 부원에게 알림 발송 */
export async function sendNoticePush(input: {
  title: string;
  body: string;
  noticeId?: string;
}) {
  if (!pushConfigured) {
    return { ok: false as const, error: "서버에 VAPID 키가 설정되지 않았습니다." };
  }
  if (subscriptionCount() === 0) {
    return { ok: false as const, error: "알림을 켠 부원이 아직 없습니다." };
  }

  const result = await sendToAll({
    title: `[공지] ${input.title}`,
    body: input.body,
    url: input.noticeId ? `/community/notice/${input.noticeId}` : "/community",
    tag: `notice-${input.noticeId ?? Date.now()}`,
  });
  return { ok: true as const, ...result };
}
