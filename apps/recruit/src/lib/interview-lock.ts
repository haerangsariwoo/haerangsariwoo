/**
 * 면접 시간 변경을 막는 시각을 다룬다.
 *
 * 면접이 끝났는지를 저장된 라벨에서 읽어 판단하려 했지만, 그 날짜는
 * 운영진이 자유롭게 적는 값이라 못 읽는 경우가 생긴다. 운영진이 시각
 * 하나를 정하는 편이 확실하고 예외도 없다.
 */

/** 지금 잠겼는가. 시각이 없으면 잠그지 않는다 */
export function isInterviewLocked(lockAt: string | null | undefined, now = new Date()) {
  if (!lockAt) return false;
  const at = new Date(lockAt);
  return !Number.isNaN(at.getTime()) && at.getTime() <= now.getTime();
}

/** <input type="datetime-local"> 이 읽는 "2026-09-11T09:00" 형태로 바꾼다 */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 입력칸의 값을 저장할 형태로 바꾼다. 비우면 null — 잠그지 않는다는 뜻 */
export function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** 화면에 보여줄 표기 */
export function formatLock(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}.${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
