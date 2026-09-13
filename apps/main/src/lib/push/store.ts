import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  memberId: string;
}

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  member_id: string;
}

function toStored(r: SubscriptionRow): StoredSubscription {
  return { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth }, memberId: r.member_id };
}

/** 같은 기기가 다시 구독하면 기존 행을 지우고 새로 넣는다 (endpoint 는 unique) */
export async function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  memberId: string;
}) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    member_id: sub.memberId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  });
  return !error;
}

export async function removeSubscription(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/** 공지 발송용 — 운영진 권한으로 호출되므로 전 부원 구독을 다 본다 */
export async function listSubscriptions(): Promise<StoredSubscription[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, member_id");
  return ((data ?? []) as SubscriptionRow[]).map(toStored);
}

export async function subscriptionCount() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

/**
 * 한 부원의 기기들. 댓글 알림처럼 부원이 부원에게 알릴 때 쓴다.
 * 남의 구독은 로그인한 사람 권한으로는 안 보이므로 서버 키로 읽는다.
 */
export async function listSubscriptionsFor(memberId: string): Promise<StoredSubscription[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, member_id")
    .eq("member_id", memberId);
  return ((data ?? []) as SubscriptionRow[]).map(toStored);
}

/** 서버 키로 지운다 — 남의 만료된 구독도 정리해야 한다 */
export async function removeSubscriptionAsAdmin(endpoint: string) {
  const admin = createAdminClient();
  await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
