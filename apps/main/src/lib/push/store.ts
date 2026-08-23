import "server-only";

/**
 * 푸시 구독 저장소.
 * 지금은 서버 메모리라 재시작하면 사라진다.
 * Supabase 연동 시 push_subscriptions 테이블로 교체한다.
 */

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** 어느 부원의 기기인지 — 로그인 붙이면 실제 학번이 들어간다 */
  memberId?: string;
  createdAt: string;
}

const subscriptions = new Map<string, StoredSubscription>();

export function saveSubscription(sub: Omit<StoredSubscription, "createdAt">) {
  subscriptions.set(sub.endpoint, { ...sub, createdAt: new Date().toISOString() });
  return subscriptions.size;
}

export function removeSubscription(endpoint: string) {
  subscriptions.delete(endpoint);
  return subscriptions.size;
}

export function listSubscriptions() {
  return [...subscriptions.values()];
}

export function subscriptionCount() {
  return subscriptions.size;
}
