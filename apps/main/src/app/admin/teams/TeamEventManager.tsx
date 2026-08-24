"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { activities } from "@/lib/activities";
import { teamEvents as teamEventsSeed, teamPool, type TeamEventDraft } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./teams.module.css";
import { TeamBoard } from "./TeamBoard";

function activityOf(activityId: string) {
  return activities.find((a) => a.id === activityId) ?? null;
}

let seq = 0;

/**
 * 팀짜기는 이제 행사 하나가 아니라 여러 행사를 각각 짤 수 있다.
 * 행사마다: 실제 활동 연결, 참여 인원 지정, 조당 인원, 조 편성을 따로 갖는다.
 * 그중 하나만 "발행" 해서 부원 홈 · 내 조에 노출한다 — 동시에 여러 개를
 * 켜두면 부원 화면에 뭘 보여줄지 알 수 없다.
 *
 * Supabase 연동 전이라 다른 관리자 화면과 같은 한계를 갖는다: 여기서
 * 발행해도 실제 부원 화면(홈 · 내 조)은 정적 목업을 그대로 보여준다.
 * 이 화면 안에서 "어느 행사가 발행 상태인지" 를 관리하는 것까지가
 * 지금 할 수 있는 일이다.
 */
export function TeamEventManager() {
  const [events, setEvents] = useState<TeamEventDraft[]>(teamEventsSeed);
  const [selectedId, setSelectedId] = useState<string | null>(events[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const usedActivityIds = new Set(events.map((e) => e.activityId));
  const availableActivities = activities.filter((a) => !usedActivityIds.has(a.id));

  const [draftActivityId, setDraftActivityId] = useState(availableActivities[0]?.id ?? "");
  const [draftTeamSize, setDraftTeamSize] = useState(6);
  const [draftParticipants, setDraftParticipants] = useState<Set<string>>(new Set());

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const selectedActivity = selected ? activityOf(selected.activityId) : null;
  const participants = selected
    ? teamPool.filter((m) => selected.participantIds.includes(m.id))
    : [];

  function updateSelected(patch: Partial<TeamEventDraft>) {
    setEvents((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...patch } : e)));
  }

  function publish(id: string) {
    setEvents((prev) => prev.map((e) => ({ ...e, published: e.id === id })));
  }

  function removeSelected() {
    if (!selectedId) return;
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== selectedId);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  function toggleDraftParticipant(id: string) {
    setDraftParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startCreate() {
    setDraftActivityId(availableActivities[0]?.id ?? "");
    setDraftTeamSize(6);
    setDraftParticipants(new Set());
    setCreating(true);
  }

  function createEvent() {
    if (!draftActivityId || draftParticipants.size === 0) return;
    seq += 1;
    const id = `te-new-${seq}`;
    const participantIds = [...draftParticipants];
    const assignments: Record<string, number | null> = {};
    participantIds.forEach((pid) => (assignments[pid] = null));

    const next: TeamEventDraft = {
      id,
      activityId: draftActivityId,
      teamSize: draftTeamSize,
      participantIds,
      assignments,
      published: false,
    };
    setEvents((prev) => [...prev, next]);
    setSelectedId(id);
    setCreating(false);
  }

  function flashSave() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <>
      <div className={toolbar.toolbar}>
        <select
          className={toolbar.select}
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          aria-label="행사 선택"
          disabled={events.length === 0}
        >
          {events.length === 0 && <option value="">아직 만든 행사가 없습니다</option>}
          {events.map((e) => {
            const a = activityOf(e.activityId);
            return (
              <option key={e.id} value={e.id}>
                {a?.title ?? "(삭제된 활동)"}
                {e.published ? " · 발행 중" : ""}
              </option>
            );
          })}
        </select>
        <span className={toolbar.spacer} />
        {selected && (
          <button type="button" className={toolbar.button} onClick={removeSelected}>
            이 행사 삭제
          </button>
        )}
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={startCreate}
          disabled={availableActivities.length === 0}
        >
          ＋ 새 행사 팀짜기
        </button>
      </div>

      {availableActivities.length === 0 && !creating && (
        <p className={styles.hint}>
          팀짜기를 만들 수 있는 활동이 더 없습니다. 새 활동은 [활동 관리] 에서 먼저 등록해 주세요.
        </p>
      )}

      {creating && (
        <div className={styles.createForm}>
          <div className={toolbar.toolbar}>
            <select
              className={toolbar.select}
              value={draftActivityId}
              onChange={(e) => setDraftActivityId(e.target.value)}
              aria-label="활동 선택"
            >
              {availableActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} · {a.dateLabel}
                </option>
              ))}
            </select>
            <select
              className={toolbar.select}
              value={draftTeamSize}
              onChange={(e) => setDraftTeamSize(Number(e.target.value))}
              aria-label="조당 인원"
            >
              <option value={4}>조당 4명</option>
              <option value={5}>조당 5명</option>
              <option value={6}>조당 6명</option>
            </select>
          </div>

          <p className={styles.colTitle}>참여 인원 선택 ({draftParticipants.size}명)</p>
          <div className={styles.participantGrid}>
            {teamPool.map((m) => (
              <label key={m.id} className={styles.participantOption}>
                <input
                  type="checkbox"
                  checked={draftParticipants.has(m.id)}
                  onChange={() => toggleDraftParticipant(m.id)}
                />
                <span>{m.name}</span>
                <span className={styles.participantMeta}>{m.cohort}</span>
              </label>
            ))}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={cn(toolbar.button, toolbar.primary)}
              onClick={createEvent}
              disabled={!draftActivityId || draftParticipants.size === 0}
            >
              팀짜기 시작
            </button>
            <button type="button" className={toolbar.button} onClick={() => setCreating(false)}>
              취소
            </button>
          </div>
        </div>
      )}

      {selected && !creating && (
        <>
          {selectedActivity && (
            <div className={styles.eventSummary}>
              <span className={styles.eventSummaryTitle}>{selectedActivity.title}</span>
              <span className={styles.eventSummaryMeta}>
                {selectedActivity.dateLabel} · {selectedActivity.place}
              </span>
              {selected.published && <span className={styles.publishedBadge}>발행 중</span>}
            </div>
          )}

          <TeamBoard
            participants={participants}
            assignments={selected.assignments}
            onAssignmentsChange={(next) => updateSelected({ assignments: next })}
            teamSize={selected.teamSize}
            onTeamSizeChange={(size) => updateSelected({ teamSize: size })}
          />

          <div className={styles.publishBar}>
            <p className={styles.publishText}>
              {savedFlash ? (
                "저장했습니다."
              ) : selected.published ? (
                <>
                  <b>{selectedActivity?.title}</b> 이(가) 부원 홈 · 내 조에 노출 중입니다.
                </>
              ) : (
                <>
                  발행하면 부원이 <b>홈 · 내 조</b>에서 이 행사의 결과를 확인할 수 있습니다.
                  (조회 전용)
                </>
              )}
            </p>
            <button type="button" className={toolbar.button} onClick={flashSave}>
              임시 저장
            </button>
            <button
              type="button"
              className={cn(toolbar.button, toolbar.primary)}
              disabled={selected.published}
              onClick={() => publish(selected.id)}
            >
              {selected.published ? "발행됨" : "이 행사로 발행"}
            </button>
          </div>
        </>
      )}
    </>
  );
}
