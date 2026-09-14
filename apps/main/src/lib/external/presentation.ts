import type { ExternalVolunteer } from "./types";

/** YYYY-MM-DD in Korea: stable across server and client timezones. */
export function koreanToday(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
}
function day(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const n = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value
    ? n
    : null;
}
export function recruitment(item: ExternalVolunteer, today: string) {
  const end = day(item.recruitEnd),
    start = day(item.recruitStart),
    current = day(today)!;
  const left = end === null ? null : Math.round((end - current) / 86400000);
  const full =
    item.capacity !== null &&
    item.capacity > 0 &&
    item.applied !== null &&
    item.applied >= item.capacity;
  if (item.closed || (left !== null && left < 0))
    return { open: false, label: "모집 마감", tone: "closed", left } as const;
  if (full)
    return { open: false, label: "정원 마감", tone: "closed", left } as const;
  if (start !== null && start > current)
    return { open: false, label: "모집 예정", tone: "upcoming", left } as const;
  if (left === 0)
    return { open: true, label: "오늘 마감", tone: "urgent", left } as const;
  if (left !== null && left <= 3)
    return {
      open: true,
      label: `${left}일 뒤 마감`,
      tone: "urgent",
      left,
    } as const;
  return {
    open: true,
    label: left === null ? "모집 정보 확인" : `${left}일 뒤 마감`,
    tone: "open",
    left,
  } as const;
}
function dateLabel(value: string) {
  if (day(value) === null) return "일정 확인 필요";
  const d = new Date(`${value}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${"일월화수목금토"[d.getUTCDay()]})`;
}
export function activityDate(start: string, end: string) {
  if (!start && !end) return "원문에서 일정 확인";
  if (!end || start === end || !start) return dateLabel(start || end);
  return `${dateLabel(start)} ~ ${dateLabel(end)}`;
}
