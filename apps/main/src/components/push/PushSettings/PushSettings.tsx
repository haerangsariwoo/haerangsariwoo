"use client";

import { useEffect, useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";
import { sendTestNotification, subscribeUser, unsubscribeUser } from "@/app/actions/push";
import {
  useIsIOS,
  useIsStandalone,
  useNotificationDenied,
  useSupportsPush,
} from "@/lib/push/client-env";
import styles from "./PushSettings.module.css";

/** VAPID 공개키(base64url)를 subscribe 가 요구하는 Uint8Array 로 바꾼다 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function PushSettings() {
  const supported = useSupportsPush();
  const isIOS = useIsIOS();
  const standalone = useIsStandalone();
  const permissionDenied = useNotificationDenied();

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [justDenied, setJustDenied] = useState(false);

  // 이미 이 기기에서 알림을 켰는지 확인한다
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker
      .register(new URL("../../../lib/service-worker.js", import.meta.url), {
        scope: "/",
        updateViaCache: "none",
      })
      .then((reg) => reg.pushManager.getSubscription())
      .then(setSubscription)
      .catch(() => setMessage("알림 기능을 준비하지 못했어요."));
  }, [supported]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setJustDenied(permission === "denied");
        setMessage("알림 권한이 허용되지 않았어요.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const res = await subscribeUser({ endpoint: json.endpoint, keys: json.keys });
      if (!res.ok) {
        await sub.unsubscribe();
        setMessage(res.error);
        return;
      }
      setSubscription(sub);
      setMessage("이제 공지가 올라오면 알림으로 알려드릴게요.");
    } catch {
      setMessage("알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!subscription) return;
    setBusy(true);
    setMessage(null);
    try {
      const { endpoint } = subscription;
      await subscription.unsubscribe();
      await unsubscribeUser(endpoint);
      setSubscription(null);
      setMessage("알림을 껐어요.");
    } catch {
      setMessage("알림을 끄지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!subscription) return;
    setBusy(true);
    setMessage(null);
    const res = await sendTestNotification(subscription.endpoint);
    setMessage(res.ok ? "테스트 알림을 보냈어요." : res.error);
    setBusy(false);
  }

  const on = Boolean(subscription);
  const denied = permissionDenied || justDenied;
  // 아이폰은 홈 화면에 추가하기 전까지 푸시 API 자체가 없다
  const needsInstall = !supported && isIOS && !standalone;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headBody}>
          <p className={styles.title}>공지 알림</p>
          <p className={styles.desc}>새 공지가 올라오면 휴대폰 알림으로 바로 알려드려요.</p>
        </div>
        {supported && (
          <Switch.Root
            checked={on}
            aria-label="공지 알림 받기"
            className={styles.switch}
            disabled={busy || denied}
            onCheckedChange={(next) => (next ? enable() : disable())}
          >
            <Switch.Thumb className={styles.knob} />
          </Switch.Root>
        )}
      </div>

      {needsInstall && (
        <div className={cn(styles.info, styles.warn)}>
          <b>아이폰은 홈 화면에 추가해야 알림을 받을 수 있어요.</b>
          <ol className={styles.steps}>
            <li>사파리 아래쪽 공유 버튼을 누르세요.</li>
            <li>&ldquo;홈 화면에 추가&rdquo;를 선택하세요.</li>
            <li>홈 화면의 해랑사리우 아이콘으로 다시 들어와 주세요.</li>
          </ol>
        </div>
      )}

      {!supported && !needsInstall && (
        <p className={styles.info}>이 브라우저는 알림을 지원하지 않아요.</p>
      )}

      {supported && denied && (
        <div className={cn(styles.info, styles.warn)}>
          알림이 차단되어 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.
        </div>
      )}

      {on && (
        <button type="button" className={styles.testButton} onClick={test} disabled={busy}>
          테스트 알림 받아보기
        </button>
      )}

      {message && <p className={cn(styles.info, on && styles.ok)}>{message}</p>}
    </div>
  );
}
