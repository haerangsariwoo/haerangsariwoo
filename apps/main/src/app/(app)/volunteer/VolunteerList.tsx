"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import { ExternalCard } from "@/components/volunteer/ExternalCard/ExternalCard";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";
import type { VolunteerSummary } from "@/lib/mock-data";
import type { ExternalFetchResult } from "@/lib/external/types";
import { recruitment } from "@/lib/external/presentation";
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

export function VolunteerList({
  external,
  internal,
  today,
}: {
  external: ExternalFetchResult;
  internal: VolunteerSummary[];
  today: string;
}) {
  const [tab, setTab] = useState<Tab>("전체");
  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const keyword = query.trim().toLocaleLowerCase("ko");
  const [extFilter, setExtFilter] = useState<ExternalFilterValue>({
    // 부원 대부분이 서울에서 활동하므로 서울부터 보여준다.
    // 다른 지역이 필요하면 "지역 전체" 로 바꿔서 보면 된다.
    sido: "서울",
    gugun: "전체",
    category: "전체",
  });

  /** 우리 동아리 봉사는 마감 임박한 순으로 */
  const internalList = useMemo(
    () =>
      internal
        .filter(
          (v) =>
            (!onlyOpen || v.status === "open" || v.status === "closing") &&
            `${v.title} ${v.org} ${v.place} ${v.category}`
              .toLocaleLowerCase("ko")
              .includes(keyword),
        )
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [internal, onlyOpen, keyword],
  );

  /** 출처별로 나눈 뒤 지역·유형 필터를 적용 */
  const externalByTab = useMemo(() => {
    const filtered = filterExternal(external.items, extFilter).filter(
      (v) =>
        (!onlyOpen || recruitment(v, today).open) &&
        `${v.title} ${v.org} ${v.area} ${v.category}`
          .toLocaleLowerCase("ko")
          .includes(keyword),
    );
    return {
      전체: filtered,
      "1365": filtered.filter((v) => v.source === "1365"),
      VMS: filtered.filter((v) => v.source === "vms"),
    };
  }, [external.items, extFilter, onlyOpen, keyword, today]);

  const externalList = externalByTab[tab];

  // 탭이나 필터가 바뀌면 처음부터 다시 센다.
  // effect 로 되돌리면 이미 그린 긴 목록이 한 번 보였다가 잘린다.
  const listKey = `${tab}|${extFilter.sido}|${extFilter.gugun}|${extFilter.category}|${keyword}|${onlyOpen}`;
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

  /** 지금 조건에서 실제로 나오는 수 */
  const totalCount =
    tab === "전체"
      ? internalList.length + externalByTab.전체.length
      : externalByTab[tab].length;

  /** 거르개를 걷었을 때의 수. 지금 수와 다르면 거르개가 줄이고 있다는 뜻이다. */
  const unfilteredCount =
    tab === "전체"
      ? internalList.length + external.items.length
      : external.items.filter((v) =>
          tab === "1365" ? v.source === "1365" : v.source === "vms",
        ).length;

  return (
    <Sheet>
      <SheetGroup>
        {/* 제목·탭·거르개는 한 블록. 나누면 사이마다 실선이 생긴다. */}
        <div className={styles.head}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>봉사 모집</h1>
            <span
              className={styles.count}
              aria-live="polite"
              aria-label={`등록된 ${unfilteredCount}개 중 ${totalCount}개 봉사`}
            >
              {totalCount}개 봉사
            </span>
          </div>
          <label className={styles.searchLabel}>
            <span className={styles.srOnly}>봉사 검색</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="봉사 이름, 지역, 관심 분야"
            />
          </label>

          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <Tabs.List className={styles.segment} aria-label="봉사 출처">
              {TABS.map((t) => (
                <Tabs.Trigger key={t} value={t} className={styles.segmentBtn}>
                  {t}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>

          <div className={styles.filterControls}>
            <div className={styles.filterTools}>
              <label className={styles.openOnly}>
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(e) => setOnlyOpen(e.target.checked)}
                />
                모집 중만 보기
              </label>
            </div>
            <details className={styles.filters}>
              <summary>
                <span>
                  {extFilter.sido === "전체" ? "지역" : extFilter.sido} 필터
                  변경
                </span>
              </summary>
              <ExternalFilters
                items={external.items}
                value={extFilter}
                onChange={setExtFilter}
              />
            </details>
          </div>

          {!external.live && (
            <p className={styles.sampleNote}>
              예시 목록입니다. 실제 모집 정보가 아니에요.
            </p>
          )}
        </div>
      </SheetGroup>

      {tab === "전체" && internalList.length > 0 && (
        <SheetGroup>
          <section>
            <h2 className={styles.groupTitle}>동아리와 함께하는 봉사</h2>
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
            <>
              <h2 className={styles.groupTitle}>직접 골라 참여하는 봉사</h2>
              <p className={styles.groupHelp}>원문에서 자세히 보고 신청해요.</p>
            </>
          )}

          {externalList.length === 0 ? (
            <div className={styles.empty}>
              <p>조건에 맞는 봉사가 없어요.</p>
              <p>검색어나 지역을 바꾸면 더 찾아볼 수 있어요.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setExtFilter({
                    sido: "전체",
                    gugun: "전체",
                    category: "전체",
                  });
                  setOnlyOpen(false);
                }}
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <>
              <div className={styles.list}>
                {visible.map((v) => (
                  <ExternalCard key={v.id} item={v} today={today} />
                ))}
              </div>

              {hasMore ? (
                <div
                  ref={sentinel}
                  className={styles.sentinel}
                  aria-hidden="true"
                />
              ) : (
                externalList.length > PAGE && (
                  <p className={styles.listEnd}>
                    {externalList.length}건을 모두 봤어요
                  </p>
                )
              )}
            </>
          )}
        </section>
      </SheetGroup>
    </Sheet>
  );
}
