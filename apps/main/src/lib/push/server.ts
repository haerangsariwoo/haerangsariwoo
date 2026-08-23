import "server-only";
import webpush from "web-push";
import { listSubscriptions, removeSubscription } from "./store";

/** 공지 알림에 실어 보내는 내용 */
export interface PushPayload {
  title: string;
  body: string;
  /** 알림을 누르면 이동할 앱 내 경로 */
  url?: string;
  /** 같은 tag 의 알림은 하나로 합쳐진다 */
  tag?: string;
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const contact = process.env.VAPID_CONTACT ?? "mailto:haerangsariwoo@hansung.ac.kr";

export const pushConfigured = Boolean(publicKey && privateKey);

if (pushConfigured) {
  webpush.setVapidDetails(contact, publicKey!, privateKey!);
}

export interface SendResult {
  sent: number;
  failed: number;
  removed: number;
}

/** 구독 중인 모든 기기에 알림을 보낸다 */
export async function sendToAll(payload: PushPayload): Promise<SendResult> {
  return send(listSubscriptions(), payload);
}

/** 특정 기기 하나에만 보낸다 (테스트 알림용) */
export async function sendToOne(endpoint: string, payload: PushPayload): Promise<SendResult> {
  const target = listSubscriptions().find((s) => s.endpoint === endpoint);
  return send(target ? [target] : [], payload);
}

async function send(
  targets: ReturnType<typeof listSubscriptions>,
  payload: PushPayload,
): Promise<SendResult> {
  if (!pushConfigured) {
    throw new Error("VAPID 키가 설정되지 않았습니다. .env.local 을 확인해 주세요.");
  }

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    targets.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body),
    ),
  );

  let sent = 0;
  let failed = 0;
  let removed = 0;

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      sent += 1;
      return;
    }
    failed += 1;
    // 410 Gone / 404 는 기기에서 이미 구독을 해제한 경우라 정리한다
    const status = (r.reason as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) {
      removeSubscription(targets[i].endpoint);
      removed += 1;
    }
  });

  return { sent, failed, removed };
}
