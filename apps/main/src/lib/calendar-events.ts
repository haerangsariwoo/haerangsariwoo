import { activities } from "./activities";
import { volunteers } from "./mock-data";
import { records } from "./my";

export type EventKind = "volunteer" | "mine" | "activity";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  meta: string;
  kind: EventKind;
  href?: string;
}

const KIND_LABEL: Record<EventKind, string> = {
  volunteer: "봉사 모집",
  mine: "내 신청",
  activity: "동아리 활동",
};

export function kindLabel(kind: EventKind) {
  return KIND_LABEL[kind];
}

/** "8.29 (토) · 15명 모집" 처럼 적힌 날짜를 올해 기준 YYYY-MM-DD 로 바꾼다 */
function toISO(label: string, year: number) {
  const m = label.match(/(\d{1,2})\.(\d{1,2})/);
  if (!m) return "";
  const [, mm, dd] = m;
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/** 내 신청 내역의 "2026.08.22" 형태 */
function fromDotted(v: string) {
  return v.replace(/\./g, "-");
}

export function buildEvents(year: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // 내가 신청한 봉사 (취소 제외)
  const myTitles = new Set<string>();
  for (const r of records) {
    if (r.state === "취소") continue;
    const date = fromDotted(r.date);
    if (!date.startsWith(String(year))) continue;
    myTitles.add(r.title);
    events.push({
      id: `mine-${r.id}`,
      date,
      title: r.title,
      meta: r.state + (r.hours ? ` · ${r.hours}시간 인정` : ""),
      kind: "mine",
    });
  }

  // 모집 중인 우리 동아리 봉사 (이미 신청한 건 제외)
  for (const v of volunteers) {
    if (myTitles.has(v.title)) continue;
    const date = toISO(v.dateLabel, year);
    if (!date) continue;
    events.push({
      id: `vol-${v.id}`,
      date,
      title: v.title,
      meta: `${v.timeLabel} · ${v.place}`,
      kind: "volunteer",
      href: `/volunteer/${v.id}`,
    });
  }

  // 동아리 행사
  for (const a of activities) {
    const date = toISO(a.dateLabel, year);
    if (!date) continue;
    events.push({
      id: `act-${a.id}`,
      date,
      title: a.title,
      meta: `${a.type} · ${a.place}`,
      kind: "activity",
      href: `/activities/${a.id}`,
    });
  }

  return events;
}
