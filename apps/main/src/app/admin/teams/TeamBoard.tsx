"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { TeamLeaders, TeamMemberRow } from "@/lib/team-shared";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./teams.module.css";

/** 미배정을 뜻하는 값. assignments[id] === null 과 같다 */
const POOL = "pool";
type Slot = number | typeof POOL;

interface TeamBoardProps {
  /** 이 행사에 참여하는 사람만 놓고 짠다 — 회원 명부 전체가 아니다 */
  participants: TeamMemberRow[];
  assignments: Record<string, number | null>;
  onAssignmentsChange: (next: Record<string, number | null>) => void;
  /** 자동 편성 계산에만 쓰는 참고값 — 실제 조 개수는 teamCount 다 */
  teamSize: number;
  onTeamSizeChange: (size: number) => void;
  /** 조 개수. 사람을 안 넣어도 빈 조를 미리 만들어 둘 수 있다 */
  teamCount: number;
  onTeamCountChange: (count: number) => void;
  /** 조마다 한 명씩 정하는 조장 */
  leaders: TeamLeaders;
  onLeaderChange: (team: number, memberId: string) => void;
  /** 지난 학기 행사면 끌기·자동 편성·인원 수 조정을 모두 막는다 */
  readOnly?: boolean;
}

export function TeamBoard({
  participants,
  assignments,
  onAssignmentsChange,
  teamSize,
  onTeamSizeChange,
  teamCount,
  onTeamCountChange,
  leaders,
  onLeaderChange,
  readOnly = false,
}: TeamBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Slot | null>(null);
  /** 키보드로 옮길 때 고른 사람 */
  const [picked, setPicked] = useState<string | null>(null);

  const teams = Array.from({ length: teamCount }, (_, i) => i + 1);

  // 조 개수를 줄여서 지금 조 번호가 더는 없는 사람도 "미배정" 으로 본다.
  // 데이터를 지우지 않고 화면에서만 그렇게 보이게 한다 — 조 개수를 다시
  // 늘리면 원래 있던 조로 그대로 돌아온다.
  const inRange = (t: number | null) => t !== null && t >= 1 && t <= teamCount;
  const unassigned = participants.filter((m) => !inRange(assignments[m.id] ?? null));

  function moveTo(id: string, slot: Slot) {
    onAssignmentsChange({ ...assignments, [id]: slot === POOL ? null : slot });
  }

  /** 성비를 맞춰 자동 편성 — 성별 묶음마다 시작 조를 달리해 한쪽으로 몰리지 않게 한다 */
  function autoAssign() {
    const count = Math.max(1, teamCount);
    const groups: TeamMemberRow["gender"][] = ["남", "여", "미정"];
    const buckets: TeamMemberRow[][] = Array.from({ length: count }, () => []);

    groups.forEach((gender, gi) => {
      const group = participants.filter((m) => m.gender === gender);
      const start = Math.floor((count * gi) / groups.length);
      group.forEach((m, i) => buckets[(start + i) % count].push(m));
    });

    const next: Record<string, number | null> = {};
    buckets.forEach((b, i) => b.forEach((m) => (next[m.id] = i + 1)));
    onAssignmentsChange(next);
  }

  function resetAll() {
    const next: Record<string, number | null> = {};
    participants.forEach((m) => (next[m.id] = null));
    onAssignmentsChange(next);
  }

  /** 조당 인원을 바꾸면 지금 인원수 기준으로 조 개수를 다시 계산해 준다 */
  function changeTeamSize(size: number) {
    const safeSize = Math.max(1, size);
    onTeamSizeChange(safeSize);
    onTeamCountChange(Math.max(1, Math.ceil(participants.length / safeSize)));
  }

  /** 드롭 대상 공통 속성 */
  const dropZone = (slot: Slot) => ({
    onDragOver: (e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      setOver(slot);
    },
    onDragLeave: () => setOver((o) => (o === slot ? null : o)),
    onDrop: (e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || dragging;
      if (id) moveTo(id, slot);
      setDragging(null);
      setOver(null);
    },
    // 키보드로 고른 사람이 있으면 눌러서 옮긴다
    onClick: () => {
      if (readOnly) return;
      if (picked) {
        moveTo(picked, slot);
        setPicked(null);
      }
    },
  });

  const memberProps = (m: TeamMemberRow) => ({
    draggable: !readOnly,
    onDragStart: (e: React.DragEvent) => {
      if (readOnly) return;
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
      if (readOnly) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setPicked((p) => (p === m.id ? null : m.id));
      }
      if (e.key === "Escape") setPicked(null);
    },
    onClick: () => !readOnly && setPicked((p) => (p === m.id ? null : m.id)),
    tabIndex: 0,
    role: "button",
    "aria-pressed": picked === m.id,
    "aria-label": `${m.name} ${inRange(assignments[m.id] ?? null) ? `${assignments[m.id]}조` : "미배정"}${readOnly ? " (읽기 전용)" : ". 누르거나 끌어서 옮깁니다"}`,
  });

  return (
    <>
      <div className={toolbar.toolbar}>
        <label className={toolbar.numberField}>
          조당 인원
          <input
            type="number"
            min={1}
            className={toolbar.number}
            value={teamSize}
            onChange={(e) => changeTeamSize(Number(e.target.value) || 1)}
            aria-label="조당 인원"
            disabled={readOnly}
          />
          명
        </label>
        <label className={toolbar.numberField}>
          조 개수
          <input
            type="number"
            min={1}
            className={toolbar.number}
            value={teamCount}
            onChange={(e) => onTeamCountChange(Math.max(1, Number(e.target.value) || 1))}
            aria-label="조 개수"
            disabled={readOnly}
          />
          개
        </label>
        <span className={toolbar.spacer} />
        <button type="button" className={toolbar.button} onClick={resetAll} disabled={readOnly}>
          전체 해제
        </button>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={autoAssign}
          disabled={readOnly}
        >
          성비 균등 자동 편성
        </button>
      </div>

      {picked && !readOnly && (
        <p className={styles.pickHint}>
          <b>{participants.find((m) => m.id === picked)?.name}</b> 을(를) 고른 상태입니다. 옮길
          조를 누르세요. (Esc 로 취소)
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
          <h3 className={styles.colTitle}>조 {teams.length}개</h3>
          <div className={styles.teamGrid}>
            {teams.map((t) => {
              const members = participants.filter((m) => assignments[m.id] === t);
              const male = members.filter((m) => m.gender === "남").length;
              const female = members.filter((m) => m.gender === "여").length;
              return (
                <div
                  key={t}
                  className={cn(styles.teamCard, over === t && styles.dropOver)}
                  {...dropZone(t)}
                >
                  <div className={styles.teamHead}>
                    <span className={styles.teamName}>{t}조</span>
                    <span className={styles.ratio}>
                      남 {male} · 여 {female}
                    </span>
                  </div>
                  {members.length > 0 && (
                    <select
                      className={styles.leaderSelect}
                      value={leaders[t] ?? ""}
                      disabled={readOnly}
                      aria-label={`${t}조 조장 선택`}
                      onChange={(e) => onLeaderChange(t, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">조장 없음</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          조장 · {m.name}
                        </option>
                      ))}
                    </select>
                  )}
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
                        {leaders[t] === m.id && <span className={styles.leaderMark}>조장</span>}
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
