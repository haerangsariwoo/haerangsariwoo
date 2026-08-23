"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { TeamMemberRow } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./teams.module.css";

/** 미배정을 뜻하는 값. team === null 과 같다 */
const POOL = "pool";
type Slot = number | typeof POOL;

function slotOf(m: TeamMemberRow): Slot {
  return m.team ?? POOL;
}

export function TeamBoard({ initial }: { initial: TeamMemberRow[] }) {
  const [pool, setPool] = useState<TeamMemberRow[]>(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Slot | null>(null);
  /** 키보드로 옮길 때 고른 사람 */
  const [picked, setPicked] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState(6);

  const teams = useMemo(() => {
    const nums = [...new Set(pool.map((m) => m.team).filter((t): t is number => t !== null))];
    return nums.sort((a, b) => a - b);
  }, [pool]);

  const unassigned = pool.filter((m) => m.team === null);

  function moveTo(id: string, slot: Slot) {
    setPool((prev) =>
      prev.map((m) => (m.id === id ? { ...m, team: slot === POOL ? null : slot } : m)),
    );
  }

  /** 성비를 맞춰 자동 편성 — 남녀를 번갈아 채운다 */
  function autoAssign() {
    const men = pool.filter((m) => m.gender === "남");
    const women = pool.filter((m) => m.gender === "여");
    const count = Math.max(1, Math.ceil(pool.length / teamSize));
    const buckets: TeamMemberRow[][] = Array.from({ length: count }, () => []);

    [men, women].forEach((group) => {
      group.forEach((m, i) => {
        // 그룹마다 시작 위치를 달리해 한쪽 성이 몰리지 않게 한다
        const start = group === women ? Math.floor(count / 2) : 0;
        buckets[(start + i) % count].push(m);
      });
    });

    const next = new Map<string, number>();
    buckets.forEach((b, i) => b.forEach((m) => next.set(m.id, i + 1)));
    setPool((prev) => prev.map((m) => ({ ...m, team: next.get(m.id) ?? null })));
  }

  function resetAll() {
    setPool((prev) => prev.map((m) => ({ ...m, team: null })));
  }

  function addTeam() {
    // 빈 조를 하나 늘린다 — 옮겨 담을 자리를 만들기 위해
    const next = (teams.at(-1) ?? 0) + 1;
    const first = pool.find((m) => m.team === null);
    if (first) moveTo(first.id, next);
  }

  /** 드롭 대상 공통 속성 */
  const dropZone = (slot: Slot) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(slot);
    },
    onDragLeave: () => setOver((o) => (o === slot ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || dragging;
      if (id) moveTo(id, slot);
      setDragging(null);
      setOver(null);
    },
    // 키보드로 고른 사람이 있으면 눌러서 옮긴다
    onClick: () => {
      if (picked) {
        moveTo(picked, slot);
        setPicked(null);
      }
    },
  });

  const memberProps = (m: TeamMemberRow) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", m.id);
      e.dataTransfer.effectAllowed = "move";
      setDragging(m.id);
    },
    onDragEnd: () => {
      setDragging(null);
      setOver(null);
    },
    // 드래그가 어려운 환경을 위해 키보드·클릭으로도 옮길 수 있게 한다
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setPicked((p) => (p === m.id ? null : m.id));
      }
      if (e.key === "Escape") setPicked(null);
    },
    onClick: () => setPicked((p) => (p === m.id ? null : m.id)),
    tabIndex: 0,
    role: "button",
    "aria-pressed": picked === m.id,
    "aria-label": `${m.name} ${slotOf(m) === POOL ? "미배정" : `${slotOf(m)}조`}. 누르거나 끌어서 옮깁니다`,
  });

  return (
    <>
      <div className={toolbar.toolbar}>
        <select className={toolbar.select} defaultValue="a2" aria-label="행사 선택">
          <option value="a2">제26회 해랑사리우 MT</option>
          <option value="a3">2학기 개강파티</option>
          <option value="a1">2학기 정기총회</option>
        </select>
        <select
          className={toolbar.select}
          value={teamSize}
          onChange={(e) => setTeamSize(Number(e.target.value))}
          aria-label="조당 인원"
        >
          <option value={4}>조당 4명</option>
          <option value={5}>조당 5명</option>
          <option value={6}>조당 6명</option>
        </select>
        <span className={toolbar.spacer} />
        <button type="button" className={toolbar.button} onClick={addTeam}>
          ＋ 조 추가
        </button>
        <button type="button" className={toolbar.button} onClick={resetAll}>
          전체 해제
        </button>
        <button type="button" className={cn(toolbar.button, toolbar.primary)} onClick={autoAssign}>
          성비 균등 자동 편성
        </button>
      </div>

      {picked && (
        <p className={styles.pickHint}>
          <b>{pool.find((m) => m.id === picked)?.name}</b> 을(를) 고른 상태입니다. 옮길 조를
          누르세요. (Esc 로 취소)
        </p>
      )}

      <div className={styles.layout}>
        <div>
          <h3 className={styles.colTitle}>미배정 {unassigned.length}명</h3>
          <div
            className={cn(styles.poolList, over === POOL && styles.dropOver)}
            {...dropZone(POOL)}
          >
            {unassigned.length === 0 && <p className={styles.emptyHint}>모두 배정됐습니다</p>}
            {unassigned.map((m) => (
              <div
                key={m.id}
                className={cn(
                  styles.poolRow,
                  dragging === m.id && styles.dragging,
                  picked === m.id && styles.picked,
                )}
                {...memberProps(m)}
              >
                <span className={styles.poolAvatar}>{m.name.charAt(0)}</span>
                <div>
                  <p className={styles.poolName}>{m.name}</p>
                  <p className={styles.poolMeta}>{m.cohort}</p>
                </div>
                <span className={cn(styles.genderTag, styles[m.gender])}>{m.gender}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className={styles.colTitle}>편성된 조 {teams.length}개</h3>
          <div className={styles.teamGrid}>
            {teams.map((t) => {
              const members = pool.filter((m) => m.team === t);
              const male = members.filter((m) => m.gender === "남").length;
              const female = members.length - male;
              return (
                <div
                  key={t}
                  className={cn(styles.teamCard, over === t && styles.dropOver)}
                  {...dropZone(t)}
                >
                  <div className={styles.teamHead}>
                    <span className={styles.teamName}>MT {t}조</span>
                    <span className={styles.ratio}>
                      남 {male} · 여 {female}
                    </span>
                  </div>
                  <div className={styles.chipRow}>
                    {members.length === 0 && (
                      <span className={styles.emptyHint}>여기로 끌어다 놓으세요</span>
                    )}
                    {members.map((m) => (
                      <span
                        key={m.id}
                        className={cn(
                          styles.memberChip,
                          dragging === m.id && styles.dragging,
                          picked === m.id && styles.picked,
                        )}
                        {...memberProps(m)}
                      >
                        <span className={cn(styles.dot, styles[m.gender])} />
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
