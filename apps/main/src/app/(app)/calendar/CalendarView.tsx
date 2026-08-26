"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import {
  buildEvents,
  kindLabel,
  type CalendarActivity,
  type CalendarRecord,
  type CalendarVolunteer,
  type EventKind,
} from "@/lib/calendar-events";
import { createClient } from "@/lib/supabase/client";
import styles from "./calendar.module.css";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const KINDS: EventKind[] = ["volunteer", "mine", "activity"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarView({ records }: { records: CalendarRecord[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(
    iso(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [volunteers, setVolunteers] = useState<CalendarVolunteer[]>([]);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: vols }, { data: acts }] = await Promise.all([
        supabase.from("internal_activities").select("id, title, date_label, time_label, place"),
        supabase.from("activities").select("id, title, date_label, type, place"),
      ]);
      setVolunteers(
        (vols ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          dateLabel: row.date_label,
          timeLabel: row.time_label,
          place: row.place,
        })),
      );
      setActivities(
        (acts ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          dateLabel: row.date_label,
          type: row.type,
          place: row.place,
        })),
      );
    }
    load();
  }, []);

  const events = useMemo(
    () => buildEvents(cursor.y, volunteers, activities, records),
    [cursor.y, volunteers, activities, records],
  );

  /** 날짜별로 묶어 점을 찍는다 */
  const byDate = useMemo(() => {
    const map = new Map<string, EventKind[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      if (!list.includes(e.kind)) list.push(e.kind);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  /** 6주 그리드에 채울 날짜들 */
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        date: iso(d.getFullYear(), d.getMonth(), d.getDate()),
        day: d.getDate(),
        weekday: d.getDay(),
        inMonth: d.getMonth() === cursor.m,
      };
    });
  }, [cursor]);

  const dayEvents = events
    .filter((e) => e.date === selected)
    .sort((a, b) => a.title.localeCompare(b.title));

  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  function move(step: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + step, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const [sy, sm, sd] = selected.split("-").map(Number);

  return (
    <div className={styles.page}>
      <PageHeader title="봉사 캘린더" back={{ href: "/home", label: "홈" }} />

      <div className={styles.monthBar}>
        <button type="button" className={styles.monthBtn} onClick={() => move(-1)} aria-label="이전 달">
          ‹
        </button>
        <span className={styles.monthLabel}>
          {cursor.y}년 {cursor.m + 1}월
        </span>
        <button type="button" className={styles.monthBtn} onClick={() => move(1)} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className={styles.legend}>
        {KINDS.map((k) => (
          <span key={k} className={styles.legendItem}>
            <span className={cn(styles.dot, styles[k])} />
            {kindLabel(k)}
          </span>
        ))}
      </div>

      <div className={styles.calendar}>
        <div className={styles.weekRow}>
          {WEEK.map((w, i) => (
            <span key={w} className={cn(styles.weekName, i === 0 && styles.sun)}>
              {w}
            </span>
          ))}
        </div>

        <div className={styles.grid}>
          {cells.map((c) => {
            const kinds = byDate.get(c.date) ?? [];
            return (
              <button
                key={c.date}
                type="button"
                className={cn(
                  styles.day,
                  c.weekday === 0 && styles.sun,
                  !c.inMonth && styles.other,
                  c.date === todayIso && styles.today,
                  c.date === selected && styles.selected,
                )}
                onClick={() => {
                  setSelected(c.date);
                  // 앞뒤 달 날짜를 누르면 그 달로 이동한다
                  if (!c.inMonth) {
                    const [y, m] = c.date.split("-").map(Number);
                    setCursor({ y, m: m - 1 });
                  }
                }}
                aria-label={`${c.day}일${kinds.length ? ` 일정 ${kinds.length}건` : ""}`}
                aria-pressed={c.date === selected}
              >
                <span className={styles.dayNum}>{c.day}</span>
                <span className={styles.dots}>
                  {kinds.map((k) => (
                    <span key={k} className={cn(styles.dot, styles[k])} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className={styles.dayPanel}>
        <h2 className={styles.dayTitle}>
          {sm}월 {sd}일 ({WEEK[new Date(sy, sm - 1, sd).getDay()]})
        </h2>

        {dayEvents.length === 0 ? (
          <p className={styles.empty}>이 날은 예정된 일정이 없어요.</p>
        ) : (
          dayEvents.map((e) => {
            const inner = (
              <>
                <span className={cn(styles.stripe, styles[e.kind])} />
                <span className={styles.eventBody}>
                  <span className={styles.eventTitle}>{e.title}</span>
                  <span className={styles.eventMeta}>{e.meta}</span>
                </span>
                <span className={cn(styles.eventTag, styles[e.kind])}>{kindLabel(e.kind)}</span>
              </>
            );

            return e.href ? (
              <Link key={e.id} href={e.href as Route} className={styles.eventCard}>
                {inner}
              </Link>
            ) : (
              <div key={e.id} className={styles.eventCard}>
                {inner}
              </div>
            );
          })
        )}
      </section>

    </div>
  );
}
