"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { FilterChips } from "@/components/ui/FilterChips/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";
import { activities, activityTypes, type Activity } from "@/lib/activities";
import styles from "./activities.module.css";

/**
 * 목록의 한 줄.
 * 왼쪽 날짜 칸이 눈이 처음 닿는 자리다. 예전에는 여기에 색 띠가 있었는데
 * 그 색은 활동마다 임의로 준 값이라 읽는 사람에게 아무 뜻이 없었다.
 */
function ActivityRow({ item, past = false }: { item: Activity; past?: boolean }) {
  return (
    <Link
      href={`/activities/${item.id}`}
      className={cn(styles.row, past && styles.pastRow)}
    >
      <div className={styles.date}>
        <span className={styles.dateNum}>{item.dateShort}</span>
        <span className={styles.dateDay}>{item.weekday}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.rowTop}>
          <span className={styles.typeTag}>{item.type}</span>
          {!past && item.dday !== null && (
            <span className={styles.dday}>{item.dday === 0 ? "오늘" : `D-${item.dday}`}</span>
          )}
        </div>

        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.meta}>
          {past ? item.place : `${item.timeLabel} · ${item.place}`}
        </p>

        {!past && (
          <div className={styles.attendRow}>
            <span className={cn(styles.attend, item.attend ? styles[item.attend] : styles.none)}>
              {item.attend ?? "참석 여부 미응답"}
            </span>
            {item.teamPublished && <span className={styles.teamFlag}>조 편성 완료</span>}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ActivitiesPage() {
  const [type, setType] = useState<string>("전체");

  const { upcoming, past } = useMemo(() => {
    const filtered = type === "전체" ? activities : activities.filter((a) => a.type === type);
    return {
      upcoming: filtered.filter((a) => a.status !== "done"),
      past: filtered.filter((a) => a.status === "done"),
    };
  }, [type]);

  const total = upcoming.length + past.length;

  return (
    <Sheet>
      <SheetGroup>
        <div className={styles.head}>
          <PageHeader title="활동" meta={`${total}건`} />
          <FilterChips options={activityTypes} value={type} onChange={setType} label="활동 유형" />
        </div>
      </SheetGroup>

      {total === 0 ? (
        <SheetGroup>
          <p className={styles.empty}>해당 유형의 활동이 없어요.</p>
        </SheetGroup>
      ) : (
        <>
          {upcoming.length > 0 && (
            <SheetGroup>
              <section>
                <p className={styles.groupLabel}>다가오는 활동</p>
                <div className={styles.list}>
                  {upcoming.map((a) => (
                    <ActivityRow key={a.id} item={a} />
                  ))}
                </div>
              </section>
            </SheetGroup>
          )}

          {past.length > 0 && (
            <SheetGroup>
              <section>
                <p className={styles.groupLabel}>지난 활동</p>
                <div className={styles.list}>
                  {past.map((a) => (
                    <ActivityRow key={a.id} item={a} past />
                  ))}
                </div>
              </section>
            </SheetGroup>
          )}
        </>
      )}
    </Sheet>
  );
}
