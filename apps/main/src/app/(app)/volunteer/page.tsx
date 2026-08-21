"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import { volunteerCategories, volunteers } from "@/lib/mock-data";
import styles from "./volunteer.module.css";

const STATUS_ORDER = { closing: 0, open: 1, waitlist: 2, closed: 3 } as const;

export default function VolunteerPage() {
  const [category, setCategory] = useState<string>("전체");

  const list = useMemo(() => {
    const filtered =
      category === "전체" ? volunteers : volunteers.filter((v) => v.category === category);
    return [...filtered].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [category]);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>봉사 모집</h1>
        <span className={styles.count}>{list.length}건</span>
      </div>

      <div className={styles.chipRow} role="tablist" aria-label="봉사 카테고리">
        {volunteerCategories.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            className={cn(styles.chip, category === c && styles.active)}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className={styles.empty}>해당 카테고리에 모집 중인 봉사가 없어요.</p>
      ) : (
        <div className={styles.list}>
          {list.map((v) => (
            <VolunteerCard key={v.id} item={v} />
          ))}
        </div>
      )}

      <p className={styles.note}>
        1365 · VMS 배지가 붙은 봉사는 원본 사이트에서 신청해야 합니다.
      </p>
    </div>
  );
}
