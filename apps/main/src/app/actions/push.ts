"use server";

import { createClient } from "@/lib/supabase/server";
import { pushConfigured, sendToAll } from "@/lib/push/server";
import { removeSubscription, saveSubscription, subscriptionCount } from "@/lib/push/store";

/** 브라우저가 만든 PushSubscription 을 JSON 으로 직렬화한 형태 */
export interface SerializedSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeUser(sub: SerializedSubscription) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "로그인이 필요합니다." };
  }

  const saved = await saveSubscription({ endpoint: sub.endpoint, keys: sub.keys, memberId: user.id });
  if (!saved) {
    return { ok: false as const, error: "구독 정보를 저장하지 못했습니다." };
  }
  return { ok: true as const, count: await subscriptionCount() };
}

export async function unsubscribeUser(endpoint: string) {
  await removeSubscription(endpoint);
  return { ok: true as const, count: await subscriptionCount() };
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
  if ((await subscriptionCount()) === 0) {
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
