"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import { ExternalCard } from "@/components/volunteer/ExternalCard/ExternalCard";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";
import { volunteers } from "@/lib/mock-data";
import type { ExternalFetchResult } from "@/lib/external/types";
import {
  ExternalFilters,
  filterExternal,
  type ExternalFilterValue,
} from "./ExternalFilters";
import styles from "./volunteer.module.css";

const STATUS_ORDER = { closing: 0, open: 1, waitlist: 2, closed: 3 } as const;

type Tab = "전체" | "1365" | "VMS";
const TABS: Tab[] = ["전체", "1365", "VMS"];

/** 한 번에 더 붙이는 건수 */
const PAGE = 8;

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

  // 탭이나 필터가 바뀌면 처음부터 다시 센다.
  // effect 로 되돌리면 이미 그린 긴 목록이 한 번 보였다가 잘린다.
  const listKey = `${tab}|${extFilter.sido}|${extFilter.gugun}|${extFilter.category}`;
  const [shownKey, setShownKey] = useState(listKey);
  const [shown, setShown] = useState(PAGE);
  if (shownKey !== listKey) {
    setShownKey(listKey);
    setShown(PAGE);
  }

  const visible = externalList.slice(0, shown);
  const hasMore = shown < externalList.length;

  /**
   * 목록 끝이 화면에 들어오기 조금 전에 다음 묶음을 붙인다.
   * 버튼을 누르게 하면 스크롤이 끊기고, 전부 한 번에 그리면
   * 외부 포털에서 수십~수백 건이 올 때 첫 화면이 그만큼 느려진다.
   *
   * shown 이 바뀔 때마다 관찰자를 다시 단다. 관찰자는 '겹침 상태가 바뀔 때'만
   * 알려주므로, 새로 붙인 줄이 화면보다 짧아 끝자리가 계속 보이는 채로 남으면
   * 다시 알려주지 않고 그대로 멈춘다. 다시 달면 지금 상태로 한 번 더 판정한다.
   * 다 불러오면 이 자리를 그리지 않으므로 멈춘다.
   */
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown((n) => n + PAGE);
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, hasMore, listKey]);

  /**
   * 탭에 붙는 수. 지역·유형 거르개를 적용한 뒤 센다.
   * 거르개를 무시하고 세면 탭에는 97 이라고 적혀 있는데 눌러보면 19건만
   * 나오는 일이 생긴다. 탭의 수는 "지금 조건에서 그 탭을 누르면 나올 수" 다.
   */
  const tabCount = (t: Tab) =>
    t === "전체" ? internalList.length + externalByTab.전체.length : externalByTab[t].length;

  /** 거르개를 걷었을 때의 수. 지금 수와 다르면 거르개가 줄이고 있다는 뜻이다. */
  const unfilteredCount =
    tab === "전체"
      ? internalList.length + external.items.length
      : external.items.filter((v) => (tab === "1365" ? v.source === "1365" : v.source === "vms"))
          .length;

  const totalCount = tabCount(tab);

  return (
    <Sheet>
      <SheetGroup>
        {/* 제목·탭·거르개는 한 블록. 나누면 사이마다 실선이 생긴다. */}
        <div className={styles.head}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>봉사 모집</h1>
            <span className={styles.count}>
              {totalCount === unfilteredCount
                ? `${totalCount}건`
                : `${unfilteredCount}건 중 ${totalCount}건`}
            </span>
          </div>

          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <Tabs.List className={styles.segment} aria-label="봉사 출처">
              {TABS.map((t) => (
                <Tabs.Trigger key={t} value={t} className={styles.segmentBtn}>
                  {t}
                  <span className={styles.segmentCount}>{tabCount(t)}</span>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>

          <ExternalFilters items={external.items} value={extFilter} onChange={setExtFilter} />

          {!external.live && (
            <p className={styles.sampleNote}>외부 포털 연동 전이라 예시 목록을 보여주고 있어요.</p>
          )}
        </div>
      </SheetGroup>

      {tab === "전체" && internalList.length > 0 && (
        <SheetGroup>
          <section>
            <h2 className={styles.groupTitle}>해랑사리우 봉사</h2>
            <div className={styles.list}>
              {internalList.map((v) => (
                <VolunteerCard key={v.id} item={v} />
              ))}
            </div>
          </section>
        </SheetGroup>
      )}

      <SheetGroup>
        <section>
          {tab === "전체" && externalList.length > 0 && (
            <h2 className={styles.groupTitle}>1365 · VMS 봉사</h2>
          )}

          {externalList.length === 0 ? (
            <p className={styles.empty}>조건에 맞는 봉사가 없어요.</p>
          ) : (
            <>
              <div className={styles.list}>
                {visible.map((v) => (
                  <ExternalCard key={v.id} item={v} />
                ))}
              </div>

              {hasMore ? (
                <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />
              ) : (
                externalList.length > PAGE && (
                  <p className={styles.listEnd}>{externalList.length}건을 모두 봤어요</p>
                )
              )}
            </>
          )}
        </section>
      </SheetGroup>
    </Sheet>
  );
}
