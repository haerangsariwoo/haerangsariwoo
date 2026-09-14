import type { Activity } from "./activities";

export const ACTIVITY_WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const DAY = 86_400_000;

export function monthDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1));
  const offset = start.getUTCDay();
  const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from(
    { length: Math.ceil((offset + length) / 7) * 7 },
    (_, i) => {
      const date = new Date(start.getTime() + (i - offset) * DAY);
      const iso = date.toISOString().slice(0, 10);
      return { iso, day: date.getUTCDate(), inMonth: iso.startsWith(month) };
    },
  );
}

export function moveMonth(month: string, step: number) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + step, 1))
    .toISOString()
    .slice(0, 7);
}

/** Legacy records have no year. Resolve once against today, never the viewed month.
 * Explicit years win; otherwise keep the existing -90/+275 day convention.
 * Completed records belong to the past. Period events are marked on their start day.
 * This is a display-only interpretation, not a migration or a recurring event.
 */
export function activityDate(item: Activity, today: string): string | null {
  const full = item.dateLabel.match(
    /(?:^|\s)(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
  );
  const short = item.dateShort.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!full && !short) return null;
  let year = full ? Number(full[1]) : Number(today.slice(0, 4));
  const month = Number(full ? full[2] : short![1]);
  const day = Number(full ? full[3] : short![2]);
  const stamp = () => Date.UTC(year, month - 1, day);
  if (!full) {
    const diff = (stamp() - Date.parse(`${today}T00:00:00Z`)) / DAY;
    if (item.status === "done") {
      if (diff > 0) year--;
    } else if (diff < -90) year++;
    else if (diff > 275) year--;
  }
  const date = new Date(stamp());
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day)
    return null;
  return date.toISOString().slice(0, 10);
}
