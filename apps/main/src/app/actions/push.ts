"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushConfigured, sendToAll, sendToMember } from "@/lib/push/server";
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

/**
 * 내 익명 글에 댓글이 달렸다고 글쓴이 휴대폰에 알린다.
 *
 * 누구에게 보낼지는 서버 전용 데이터베이스 함수가 정한다. 그 함수는 부르는
 * 사람이 그 댓글을 방금 쓴 본인일 때만 답한다 — 남의 댓글 id 로 글쓴이에게
 * 알림을 계속 울리게 할 수 없게. 알림에는 누가 달았는지 적지 않는다.
 *
 * 쪽지함 알림은 댓글을 쓸 때 데이터베이스가 이미 넣었다. 여기서 실패해도
 * 댓글은 올라가 있으므로 조용히 넘긴다.
 */
export async function notifyAnonComment(commentId: string) {
  if (!pushConfigured) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data } = await admin.rpc("anon_comment_push_target", {
    p_comment_id: commentId,
    p_caller: user.id,
  });
  const target = (data as { member_id: string; post_id: string; preview: string }[] | null)?.[0];
  if (!target) return;

  try {
    await sendToMember(target.member_id, {
      title: "내 익명 글에 댓글이 달렸어요",
      body: target.preview,
      url: `/community/anon/${target.post_id}`,
      // 같은 글의 댓글 알림은 하나로 합친다 — 댓글이 몰리면 휴대폰이 계속 울린다
      tag: `anon-comment-${target.post_id}`,
    });
  } catch {
    // 알림이 안 가도 댓글과 쪽지는 이미 남았다
  }
}
