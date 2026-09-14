"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { activityTypes, type Activity } from "@/lib/activities";
import {
  ACTIVITY_WEEK,
  activityDate,
  monthDays,
  moveMonth,
} from "@/lib/activity-calendar";
import styles from "./activities.module.css";

function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d={back ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} />
    </svg>
  );
}

function ActivityRow({ item }: { item: Activity }) {
  const past = item.status === "done";
  return (
    <Link href={`/activities/${item.id}`} className={styles.row}>
      <div className={styles.date}>
        <strong>{item.dateShort || "미정"}</strong>
        <span>{item.weekday ? `${item.weekday}요일` : "날짜 미정"}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.rowTop}>
          <span className={styles.typeTag}>{item.type}</span>
          {item.status === "closed" ? (
            <span className={styles.dday}>접수 마감</span>
          ) : (
            !past &&
            item.dday !== null &&
            item.dday >= 0 && (
              <span className={styles.dday}>
                {item.dday === 0 ? "오늘" : `D-${item.dday}`}
              </span>
            )
          )}
        </div>
        <h3 className={styles.title}>{item.title}</h3>
        <dl className={styles.meta}>
          <div>
            <dt>시간</dt>
            <dd>{item.timeLabel || "시간 미정"}</dd>
          </div>
          <div>
            <dt>장소</dt>
            <dd>{item.place || "장소 미정"}</dd>
          </div>
          {/[~～〜–]/.test(item.dateLabel) && (
            <div>
              <dt>기간</dt>
              <dd>{item.dateLabel}</dd>
            </div>
          )}
        </dl>
        {!past && (
          <div className={styles.attendRow}>
            <span
              className={cn(
                styles.attend,
                item.attend ? styles[item.attend] : styles.none,
              )}
            >
              {item.attend ?? "참석 여부 선택하기"}
            </span>
            {item.teamPublished && (
              <span className={styles.teamFlag}>조 편성 완료</span>
            )}
            <Chevron />
          </div>
        )}
      </div>
    </Link>
  );
}

export function ActivityList({
  activities,
  today,
}: {
  activities: Activity[];
  today: string;
}) {
  const [type, setType] = useState<string>("전체");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState<string | null>(null);
  const dated = useMemo(
    () => activities.map((item) => ({ item, date: activityDate(item, today) })),
    [activities, today],
  );
  const filtered = dated.filter(
    ({ item }) => type === "전체" || item.type === type,
  );
  const byDate = new Map<string, number>();
  for (const { date } of filtered)
    if (date) byDate.set(date, (byDate.get(date) ?? 0) + 1);
  const upcoming = filtered
    .filter(({ item }) => item.status !== "done")
    .sort(
      (a, b) =>
        (a.date ?? "9999").localeCompare(b.date ?? "9999") ||
        a.item.timeLabel.localeCompare(b.item.timeLabel),
    );
  const past = filtered
    .filter(({ item }) => item.status === "done")
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const visible = selected
    ? filtered
        .filter(({ date }) => date === selected)
        .sort((a, b) => a.item.timeLabel.localeCompare(b.item.timeLabel))
    : upcoming;
  const monthCount = filtered.filter(({ date }) =>
    date?.startsWith(month),
  ).length;
  const [year, monthNumber] = month.split("-").map(Number);
  const selectedLabel = selected
    ? `${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8))}일 활동`
    : "다가오는 활동";

  return (
    <div className={styles.page} data-full-bleed>
      <header className={styles.head}>
        <h1>활동</h1>
        <Link
          href="/calendar"
          data-tour="activity-calendar"
          className={styles.allCalendar}
        >
          봉사 일정도 보기
          <Chevron />
        </Link>
      </header>
      <div className={styles.filters} role="group" aria-label="활동 유형">
        {activityTypes.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={type === option}
            onClick={() => setType(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <section className={styles.calendar} aria-label="활동 달력">
        <div className={styles.monthBar}>
          <div>
            <h2 aria-live="polite">
              {year}년 {monthNumber}월
            </h2>
            <p>이달의 활동 {monthCount}건</p>
          </div>
          <div className={styles.monthControls}>
            <button
              type="button"
              onClick={() => {
                setMonth(today.slice(0, 7));
                setSelected(today);
              }}
            >
              오늘
            </button>
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => {
                setMonth(moveMonth(month, -1));
                setSelected(null);
              }}
            >
              <Chevron back />
            </button>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => {
                setMonth(moveMonth(month, 1));
                setSelected(null);
              }}
            >
              <Chevron />
            </button>
          </div>
        </div>
        <div className={styles.week} aria-hidden="true">
          {ACTIVITY_WEEK.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className={styles.grid}>
          {monthDays(month).map((cell) => {
            const count = byDate.get(cell.iso) ?? 0;
            return (
              <button
                key={cell.iso}
                type="button"
                className={cn(
                  styles.day,
                  !cell.inMonth && styles.outside,
                  cell.iso === today && styles.today,
                )}
                aria-label={`${Number(cell.iso.slice(0, 4))}년 ${Number(cell.iso.slice(5, 7))}월 ${cell.day}일, 활동 ${count}건${cell.iso === today ? ", 오늘" : ""}`}
                aria-pressed={selected === cell.iso}
                aria-current={cell.iso === today ? "date" : undefined}
                onClick={() => {
                  setSelected(selected === cell.iso ? null : cell.iso);
                  setMonth(cell.iso.slice(0, 7));
                }}
              >
                <span>{cell.day}</span>
                <span className={styles.marker} aria-hidden="true">
                  {count > 0 && <i />}
                </span>
              </button>
            );
          })}
        </div>
        <p className={styles.calendarHint}>
          <i aria-hidden="true" />
          활동이 있는 날을 눌러보세요
        </p>
      </section>

      <section
        className={styles.agenda}
        aria-labelledby="activity-agenda-title"
      >
        <div className={styles.sectionHead}>
          <h2 id="activity-agenda-title" aria-live="polite">
            {selectedLabel} <span>{visible.length}</span>
          </h2>
          {selected && (
            <button type="button" onClick={() => setSelected(null)}>
              전체 일정
            </button>
          )}
        </div>
        {visible.length ? (
          <div className={styles.list}>
            {visible.map(({ item }) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>
              {selected
                ? "이날은 등록된 활동이 없어요."
                : activities.length === 0
                  ? "아직 등록된 활동이 없어요."
                  : "예정된 활동이 없어요."}
            </p>
            <span>
              {selected
                ? "달력에서 다른 날짜를 선택해보세요."
                : type !== "전체"
                  ? "다른 유형도 확인해보세요."
                  : "새 활동이 등록되면 여기서 확인할 수 있어요."}
            </span>
            {type !== "전체" && (
              <button type="button" onClick={() => setType("전체")}>
                모든 유형 보기
              </button>
            )}
          </div>
        )}
      </section>
      {!selected && past.length > 0 && (
        <details className={styles.past}>
          <summary>
            지난 활동 <span>{past.length}건</span>
          </summary>
          <div className={styles.list}>
            {past.map(({ item }) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
