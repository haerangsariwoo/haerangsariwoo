"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { toTeamGender, type TeamLeaders, type TeamMemberRow } from "@/lib/team-shared";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./teams.module.css";
import { TeamBoard } from "./TeamBoard";

interface ActivityLite {
  id: string;
  title: string;
  date_label: string;
  place: string;
  type: string;
}

interface TeamEvent {
  id: string;
  activityId: string;
  teamSize: number;
  teamCount: number;
  published: boolean;
  participants: TeamMemberRow[];
  assignments: Record<string, number | null>;
  leaders: TeamLeaders;
}

interface MemberLite {
  id: string;
  name: string;
  cohort: string;
  gender: string | null;
}

/**
 * 팀짜기는 행사 하나가 아니라 여러 행사를 각각 짤 수 있다.
 * 행사마다: 활동 연결, 참여 인원, 조당 인원, 조 편성을 따로 갖는다.
 * 그중 하나만 "발행" 해서 부원 홈 · 내 조에 노출한다 — 동시에 여러 개를
 * 켜두면 부원 화면에 뭘 보여줄지 알 수 없다.
 *
 * 참여 인원은 해당 활동에 "참석" 으로 응답한 부원만 올라온다.
 */
export function TeamEventManager() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [activities, setActivities] = useState<ActivityLite[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftActivityId, setDraftActivityId] = useState("");
  const [draftTeamSize, setDraftTeamSize] = useState(6);
  const [draftAttendees, setDraftAttendees] = useState<TeamMemberRow[]>([]);
  const [draftPicked, setDraftPicked] = useState<Set<string>>(new Set());
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data: acts }, { data: evs }] = await Promise.all([
        supabase.from("activities").select("id, title, date_label, place, type"),
        supabase.from("team_events").select("id, activity_id, team_size, team_count, published"),
      ]);
      if (cancelled) return;

      setActivities((acts ?? []) as ActivityLite[]);

      const eventRows = (evs ?? []) as {
        id: string;
        activity_id: string;
        team_size: number;
        team_count: number;
        published: boolean;
      }[];

      if (eventRows.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data: assigns } = await supabase
        .from("team_assignments")
        .select("team_event_id, member_id, team_number, is_leader, members(name, cohort, gender)")
        .in(
          "team_event_id",
          eventRows.map((e) => e.id),
        );
      if (cancelled) return;

      const rows = (assigns ?? []) as unknown as {
        team_event_id: string;
        member_id: string;
        team_number: number | null;
        is_leader: boolean;
        members: { name: string; cohort: string; gender: string | null } | null;
      }[];

      setEvents(
        eventRows.map((e) => {
          const mine = rows.filter((r) => r.team_event_id === e.id);
          const assignments: Record<string, number | null> = {};
          const leaders: TeamLeaders = {};
          mine.forEach((r) => {
            assignments[r.member_id] = r.team_number;
            if (r.is_leader && r.team_number !== null) leaders[r.team_number] = r.member_id;
          });
          return {
            id: e.id,
            activityId: e.activity_id,
            teamSize: e.team_size,
            teamCount: e.team_count,
            published: e.published,
            participants: mine.map((r) => ({
              id: r.member_id,
              name: r.members?.name ?? "(탈퇴)",
              cohort: r.members?.cohort ?? "",
              gender: toTeamGender(r.members?.gender),
            })),
            assignments,
            leaders,
          };
        }),
      );
      setSelectedId(eventRows[0]?.id ?? null);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const activityOf = (id: string) => activities.find((a) => a.id === id) ?? null;
  const usedActivityIds = new Set(events.map((e) => e.activityId));
  const availableActivities = activities.filter((a) => !usedActivityIds.has(a.id));

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const selectedActivity = selected ? activityOf(selected.activityId) : null;

  /** 그 활동에 "참석" 으로 응답한 부원만 데려온다 */
  async function loadAttendees(activityId: string) {
    if (!activityId) {
      setDraftAttendees([]);
      return;
    }
    setDraftLoading(true);
    const { data } = await supabase
      .from("activity_rsvps")
      .select("member_id, members(name, cohort, gender)")
      .eq("activity_id", activityId)
      .eq("state", "참석");

    const rows = (data ?? []) as unknown as {
      member_id: string;
      members: MemberLite | null;
    }[];
    const people = rows.map((r) => ({
      id: r.member_id,
      name: r.members?.name ?? "(탈퇴)",
      cohort: r.members?.cohort ?? "",
      gender: toTeamGender(r.members?.gender),
    }));
    setDraftAttendees(people);
    setDraftPicked(new Set(people.map((p) => p.id)));
    setDraftLoading(false);
  }

  function startCreate() {
    const first = availableActivities[0]?.id ?? "";
    setDraftActivityId(first);
    setDraftTeamSize(6);
    setDraftPicked(new Set());
    setCreating(true);
    loadAttendees(first);
  }

  function pickDraftActivity(id: string) {
    setDraftActivityId(id);
    loadAttendees(id);
  }

  function toggleDraftParticipant(id: string) {
    setDraftPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createEvent() {
    if (!draftActivityId || draftPicked.size === 0) return;
    const participants = draftAttendees.filter((p) => draftPicked.has(p.id));
    const teamCount = Math.max(1, Math.ceil(participants.length / draftTeamSize));

    const { data, error: insertError } = await supabase
      .from("team_events")
      .insert({ activity_id: draftActivityId, team_size: draftTeamSize, team_count: teamCount })
      .select("id")
      .single();

    if (insertError || !data) {
      setError("팀짜기를 만들지 못했습니다. 이미 만든 활동인지 확인해 주세요.");
      return;
    }

    const eventId = (data as { id: string }).id;
    const { error: assignError } = await supabase.from("team_assignments").insert(
      participants.map((p) => ({ team_event_id: eventId, member_id: p.id, team_number: null })),
    );
    if (assignError) {
      await supabase.from("team_events").delete().eq("id", eventId);
      setError("참여 인원을 저장하지 못했습니다.");
      return;
    }

    const assignments: Record<string, number | null> = {};
    participants.forEach((p) => (assignments[p.id] = null));
    setEvents((prev) => [
      ...prev,
      {
        id: eventId,
        activityId: draftActivityId,
        teamSize: draftTeamSize,
        teamCount,
        published: false,
        participants,
        assignments,
        leaders: {},
      },
    ]);
    setSelectedId(eventId);
    setCreating(false);
  }

  async function updateSelected(patch: Partial<Pick<TeamEvent, "teamSize" | "teamCount">>) {
    if (!selectedId) return;
    setEvents((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...patch } : e)));
    const payload: Record<string, number> = {};
    if (patch.teamSize !== undefined) payload.team_size = patch.teamSize;
    if (patch.teamCount !== undefined) payload.team_count = patch.teamCount;
    await supabase.from("team_events").update(payload).eq("id", selectedId);
  }

  /** 바뀐 사람만 골라 저장한다 — 끌어다 놓을 때마다 전체를 다시 쓰지 않는다 */
  async function changeAssignments(next: Record<string, number | null>) {
    if (!selected) return;
    const before = selected.assignments;
    const changed = Object.keys(next).filter((id) => (before[id] ?? null) !== (next[id] ?? null));

    // 조를 옮긴 사람이 원래 조의 조장이었다면 그 자리는 비워 둔다
    const leaders: TeamLeaders = { ...selected.leaders };
    for (const [team, memberId] of Object.entries(leaders)) {
      if ((next[memberId] ?? null) !== Number(team)) delete leaders[Number(team)];
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === selected.id ? { ...e, assignments: next, leaders } : e)),
    );

    const results = await Promise.all(
      changed.map((memberId) =>
        supabase
          .from("team_assignments")
          .update({ team_number: next[memberId] })
          .eq("team_event_id", selected.id)
          .eq("member_id", memberId),
      ),
    );
    if (results.some((r) => r.error)) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selected.id ? { ...e, assignments: before, leaders: selected.leaders } : e,
        ),
      );
      setError("조 편성을 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    // 조를 벗어난 사람의 조장 표시를 실제로도 내린다
    const dropped = Object.values(selected.leaders).filter((id) => !Object.values(leaders).includes(id));
    if (dropped.length > 0) {
      await supabase
        .from("team_assignments")
        .update({ is_leader: false })
        .eq("team_event_id", selected.id)
        .in("member_id", dropped);
    }
  }

  /** 한 조에 조장은 한 명 — 기존 조장을 내리고 새로 세운다 */
  async function changeLeader(team: number, memberId: string) {
    if (!selected) return;
    const before = selected.leaders;
    const next: TeamLeaders = { ...before };
    if (memberId) next[team] = memberId;
    else delete next[team];

    setEvents((prev) => prev.map((e) => (e.id === selected.id ? { ...e, leaders: next } : e)));

    const teamMembers = selected.participants
      .filter((p) => selected.assignments[p.id] === team)
      .map((p) => p.id);

    const { error: clearError } = await supabase
      .from("team_assignments")
      .update({ is_leader: false })
      .eq("team_event_id", selected.id)
      .in("member_id", teamMembers);

    const { error: setError2 } = memberId
      ? await supabase
          .from("team_assignments")
          .update({ is_leader: true })
          .eq("team_event_id", selected.id)
          .eq("member_id", memberId)
      : { error: null };

    if (clearError || setError2) {
      setEvents((prev) => prev.map((e) => (e.id === selected.id ? { ...e, leaders: before } : e)));
      setError("조장을 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  async function publish(id: string) {
    const prev = events;
    setEvents((cur) => cur.map((e) => ({ ...e, published: e.id === id })));
    const { error: offError } = await supabase
      .from("team_events")
      .update({ published: false })
      .neq("id", id);
    const { error: onError } = await supabase
      .from("team_events")
      .update({ published: true })
      .eq("id", id);
    if (offError || onError) {
      setEvents(prev);
      setError("발행하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  async function removeSelected() {
    if (!selectedId) return;
    if (!window.confirm("이 행사의 팀짜기를 삭제할까요? 조 편성 결과도 함께 지워집니다.")) return;
    const prev = events;
    const next = events.filter((e) => e.id !== selectedId);
    setEvents(next);
    setSelectedId(next[0]?.id ?? null);
    const { error: deleteError } = await supabase.from("team_events").delete().eq("id", selectedId);
    if (deleteError) {
      setEvents(prev);
      setError("삭제하지 못했습니다.");
    }
  }

  if (loading) return <p className={styles.hint}>불러오는 중...</p>;

  return (
    <>
      {error && <p className={styles.hint}>{error}</p>}

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
          <button
            type="button"
            className={toolbar.button}
            onClick={removeSelected}
            disabled={readOnly}
          >
            이 행사 삭제
          </button>
        )}
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={startCreate}
          disabled={readOnly || availableActivities.length === 0}
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
              onChange={(e) => pickDraftActivity(e.target.value)}
              aria-label="활동 선택"
            >
              {availableActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} · {a.date_label}
                </option>
              ))}
            </select>
            <label className={toolbar.numberField}>
              조당 인원
              <input
                type="number"
                min={1}
                className={toolbar.number}
                value={draftTeamSize}
                onChange={(e) => setDraftTeamSize(Math.max(1, Number(e.target.value) || 1))}
                aria-label="조당 인원"
              />
              명
            </label>
          </div>

          <p className={styles.colTitle}>
            참여 인원 선택 ({draftPicked.size}명 / 참석 응답 {draftAttendees.length}명)
          </p>
          {draftLoading ? (
            <p className={styles.hint}>참석자를 불러오는 중...</p>
          ) : draftAttendees.length === 0 ? (
            <p className={styles.hint}>
              이 활동에 &ldquo;참석&rdquo; 으로 응답한 부원이 아직 없습니다. 부원이 활동 상세에서
              참석을 누르면 여기에 나타납니다.
            </p>
          ) : (
            <div className={styles.participantGrid}>
              {draftAttendees.map((m) => (
                <label key={m.id} className={styles.participantOption}>
                  <input
                    type="checkbox"
                    checked={draftPicked.has(m.id)}
                    onChange={() => toggleDraftParticipant(m.id)}
                  />
                  <span>{m.name}</span>
                  <span className={styles.participantMeta}>{m.cohort}</span>
                </label>
              ))}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={cn(toolbar.button, toolbar.primary)}
              onClick={createEvent}
              disabled={!draftActivityId || draftPicked.size === 0}
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
                {selectedActivity.date_label} · {selectedActivity.place}
              </span>
              {selected.published && <span className={styles.publishedBadge}>발행 중</span>}
            </div>
          )}

          <TeamBoard
            participants={selected.participants}
            assignments={selected.assignments}
            onAssignmentsChange={changeAssignments}
            teamSize={selected.teamSize}
            onTeamSizeChange={(size) => updateSelected({ teamSize: size })}
            teamCount={selected.teamCount}
            onTeamCountChange={(count) => updateSelected({ teamCount: count })}
            leaders={selected.leaders}
            onLeaderChange={changeLeader}
            readOnly={readOnly}
          />

          <div className={styles.publishBar}>
            <p className={styles.publishText}>
              {selected.published ? (
                <>
                  <b>{selectedActivity?.title}</b> 이(가) 부원 홈 · 내 조에 노출 중입니다.
                </>
              ) : readOnly ? (
                "지난 학기 행사는 발행 상태를 바꿀 수 없습니다."
              ) : (
                <>
                  조 편성은 옮길 때마다 바로 저장됩니다. 발행하면 부원이 <b>홈 · 내 조</b>에서
                  결과를 확인할 수 있습니다.
                </>
              )}
            </p>
            <button
              type="button"
              className={cn(toolbar.button, toolbar.primary)}
              disabled={readOnly || selected.published}
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
