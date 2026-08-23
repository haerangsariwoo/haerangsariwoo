"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import { ExternalCard } from "@/components/volunteer/ExternalCard/ExternalCard";
import { volunteerCategories, volunteers } from "@/lib/mock-data";
import type { ExternalFetchResult } from "@/lib/external/types";
import {
  ExternalFilters,
  filterExternal,
  type ExternalFilterValue,
} from "./ExternalFilters";
import { noticeFor } from "@/lib/get-notice";
import styles from "./volunteer.module.css";

const STATUS_ORDER = { closing: 0, open: 1, waitlist: 2, closed: 3 } as const;

type Tab = "내부" | "1365 · VMS";

export function VolunteerList({ external }: { external: ExternalFetchResult }) {
  const [tab, setTab] = useState<Tab>("내부");
  const [category, setCategory] = useState<string>("전체");
  // 외부 목록은 지역·유형을 앱 안에서 직접 고른다 (기본은 서울)
  const [extFilter, setExtFilter] = useState<ExternalFilterValue>({
    sido: external.items.some((v) => v.sido === "서울") ? "서울" : "전체",
    gugun: "전체",
    category: "전체",
  });

  const internalList = useMemo(() => {
    const filtered =
      category === "전체" ? volunteers : volunteers.filter((v) => v.category === category);
    return [...filtered].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [category]);

  const externalList = useMemo(
    () => filterExternal(external.items, extFilter),
    [external.items, extFilter],
  );

  const list = tab === "내부" ? internalList : externalList;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>봉사 모집</h1>
        <span className={styles.count}>{list.length}건</span>
      </div>

      <div className={styles.segment} role="tablist" aria-label="봉사 출처">
        {(["내부", "1365 · VMS"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={cn(styles.segmentBtn, tab === t && styles.segmentOn)}
            onClick={() => setTab(t)}
          >
            {t}
            <span className={styles.segmentCount}>
              {t === "내부" ? volunteers.length : external.items.length}
            </span>
          </button>
        ))}
      </div>

      {tab === "내부" ? (
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
      ) : (
        <ExternalFilters
          items={external.items}
          value={extFilter}
          onChange={setExtFilter}
        />
      )}

      {tab === "내부" ? (
        internalList.length === 0 ? (
          <p className={styles.empty}>해당 카테고리에 모집 중인 봉사가 없어요.</p>
        ) : (
          <div className={styles.list}>
            {internalList.map((v) => (
              <VolunteerCard key={v.id} item={v} />
            ))}
          </div>
        )
      ) : (
        <>
          {!external.live && (
            <p className={styles.sampleNote}>
              외부 포털 연동 전이라 예시 목록을 보여주고 있어요.
            </p>
          )}
          {externalList.length === 0 ? (
            <p className={styles.empty}>해당 카테고리에 모집 중인 봉사가 없어요.</p>
          ) : (
            <div className={styles.list}>
              {externalList.map((v) => (
                <ExternalCard key={v.id} item={v} />
              ))}
            </div>
          )}
        </>
      )}

      <p className={styles.note}>{noticeFor("봉사 모집")}</p>
    </div>
  );
}
