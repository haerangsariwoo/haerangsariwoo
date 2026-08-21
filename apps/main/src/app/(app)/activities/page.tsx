"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { FilterChips } from "@/components/ui/FilterChips/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { activities, activityTypes } from "@/lib/activities";
import { noticeFor } from "@/lib/get-notice";
import styles from "./activities.module.css";

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
    <div className={styles.page}>
      <PageHeader title="활동" meta={`${total}건`} />

      <FilterChips options={activityTypes} value={type} onChange={setType} label="활동 유형" />

      {total === 0 ? (
        <p className={styles.empty}>해당 유형의 활동이 없어요.</p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className={styles.list}>
              <p className={styles.groupLabel}>다가오는 활동</p>
              {upcoming.map((a) => (
                <Link key={a.id} href={`/activities/${a.id}`} className={styles.card}>
                  <span className={cn(styles.stripe, styles[a.tone])} />
                  <div className={styles.body}>
                    <div className={styles.topRow}>
                      <span className={styles.typeTag}>{a.type}</span>
                      {a.dday !== null && (
                        <span className={styles.dday}>{a.dday === 0 ? "오늘" : `D-${a.dday}`}</span>
                      )}
                    </div>
                    <h2 className={styles.title}>{a.title}</h2>
                    <div className={styles.metaRow}>
                      <span className={styles.meta}>
                        {a.dateLabel} · {a.timeLabel}
                      </span>
                      <span className={styles.meta}>{a.place}</span>
                    </div>
                    <div className={styles.attendRow}>
                      <span className={cn(styles.attend, a.attend ? styles[a.attend] : styles.none)}>
                        {a.attend ?? "참석 여부 미응답"}
                      </span>
                      {a.teamPublished && <span className={styles.teamFlag}>조 편성 완료</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className={styles.list}>
              <p className={styles.groupLabel}>지난 활동</p>
              {past.map((a) => (
                <Link
                  key={a.id}
                  href={`/activities/${a.id}`}
                  className={cn(styles.card, styles.past)}
                >
                  <span className={cn(styles.stripe, styles[a.tone])} />
                  <div className={styles.body}>
                    <div className={styles.topRow}>
                      <span className={styles.typeTag}>{a.type}</span>
                    </div>
                    <h2 className={styles.title}>{a.title}</h2>
                    <div className={styles.metaRow}>
                      <span className={styles.meta}>
                        {a.dateLabel} · {a.place}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <p className={styles.note}>
        {noticeFor("활동")}
      </p>
    </div>
  );
}
