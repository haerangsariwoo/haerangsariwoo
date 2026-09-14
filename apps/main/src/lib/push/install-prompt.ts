interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
type InstallSnapshot = { event: InstallEvent | null; busy: boolean; installed: boolean; error: string | null };
const EMPTY: InstallSnapshot = { event: null, busy: false, installed: false, error: null };
let snapshot = EMPTY;
const listeners = new Set<() => void>();
function update(value: Partial<InstallSnapshot>) {
  snapshot = { ...snapshot, ...value };
  listeners.forEach((notify) => notify());
}
function capture(event: Event) {
  event.preventDefault();
  update({ event: event as InstallEvent, error: null });
}
function installed() {
  update({ installed: true, event: null, busy: false });
}
export function subscribeInstallPrompt(notify: () => void) {
  if (!listeners.size) {
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
  }
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
    if (!listeners.size) {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    }
  };
}
export const installSnapshot = () => snapshot;
export const installServerSnapshot = () => EMPTY;

/** Called only by an install button, never by mounting the onboarding. */
export async function requestInstall() {
  const event = snapshot.event;
  if (!event || snapshot.busy) return false;
  update({ event: null, busy: true, error: null });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    const accepted = outcome === "accepted";
    update({ installed: snapshot.installed || accepted });
    return accepted;
  } catch {
    update({ error: "설치를 시작하지 못했어요. 브라우저 메뉴에서 홈 화면에 추가해 주세요." });
    return false;
  } finally {
    update({ busy: false });
  }
}
