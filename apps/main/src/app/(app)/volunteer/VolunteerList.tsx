"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import { ExternalCard } from "@/components/volunteer/ExternalCard/ExternalCard";
import { volunteers } from "@/lib/mock-data";
import type { ExternalFetchResult } from "@/lib/external/types";
import {
  ExternalFilters,
  filterExternal,
  type ExternalFilterValue,
} from "./ExternalFilters";
import { noticeFor } from "@/lib/get-notice";
import styles from "./volunteer.module.css";

const STATUS_ORDER = { closing: 0, open: 1, waitlist: 2, closed: 3 } as const;

type Tab = "전체" | "1365" | "VMS";
const TABS: Tab[] = ["전체", "1365", "VMS"];

export function VolunteerList({ external }: { external: ExternalFetchResult }) {
  const [tab, setTab] = useState<Tab>("전체");
  const [extFilter, setExtFilter] = useState<ExternalFilterValue>({
    sido: external.items.some((v) => v.sido === "서울") ? "서울" : "전체",
    gugun: "전체",
    category: "전체",
  });

  /** 우리 동아리 봉사는 마감 임박한 순으로 */
  const internalList = useMemo(
    () => [...volunteers].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [],
  );

  /** 출처별로 나눈 뒤 지역·유형 필터를 적용 */
  const externalByTab = useMemo(() => {
    const filtered = filterExternal(external.items, extFilter);
    return {
      전체: filtered,
      "1365": filtered.filter((v) => v.source === "1365"),
      VMS: filtered.filter((v) => v.source === "vms"),
    };
  }, [external.items, extFilter]);

  const externalList = externalByTab[tab];
  // 전체 탭에서는 우리 동아리 봉사를 맨 위에 올린다
  const totalCount =
    tab === "전체" ? internalList.length + externalList.length : externalList.length;

  const tabCount = (t: Tab) => {
    const ext =
      t === "전체"
        ? external.items.length
        : external.items.filter((v) => (t === "1365" ? v.source === "1365" : v.source === "vms"))
            .length;
    return t === "전체" ? volunteers.length + ext : ext;
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>봉사 모집</h1>
        <span className={styles.count}>{totalCount}건</span>
      </div>

      <div className={styles.segment} role="tablist" aria-label="봉사 출처">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={cn(styles.segmentBtn, tab === t && styles.segmentOn)}
            onClick={() => setTab(t)}
          >
            {t}
            <span className={styles.segmentCount}>{tabCount(t)}</span>
          </button>
        ))}
      </div>

      <ExternalFilters items={external.items} value={extFilter} onChange={setExtFilter} />

      {!external.live && (
        <p className={styles.sampleNote}>
          외부 포털 연동 전이라 예시 목록을 보여주고 있어요.
        </p>
      )}

      {tab === "전체" && internalList.length > 0 && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>해랑사리우 봉사</h2>
          <div className={styles.list}>
            {internalList.map((v) => (
              <VolunteerCard key={v.id} item={v} />
            ))}
          </div>
        </section>
      )}

      <section className={styles.group}>
        {tab === "전체" && externalList.length > 0 && (
          <h2 className={styles.groupTitle}>1365 · VMS 봉사</h2>
        )}
        {externalList.length === 0 ? (
          <p className={styles.empty}>조건에 맞는 봉사가 없어요.</p>
        ) : (
          <div className={styles.list}>
            {externalList.map((v) => (
              <ExternalCard key={v.id} item={v} />
            ))}
          </div>
        )}
      </section>

      <p className={styles.note}>{noticeFor("봉사 모집")}</p>
    </div>
  );
}
