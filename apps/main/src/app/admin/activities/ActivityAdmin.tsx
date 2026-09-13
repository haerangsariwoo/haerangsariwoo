"use client";

import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import {
  ACTIVITY_TONES,
  ACTIVITY_TYPES,
  labelsFromDate,
  type ActivityStatus,
  type AttendState,
  type ActivityTone,
  type ActivityType,
} from "@/lib/activities";
import type { ActivityRow } from "@/lib/activity-queries";
import { isoFromLabel } from "@/lib/semester";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";
import rsvpStyles from "./rsvp.module.css";

const STATUS_LABEL: Record<ActivityStatus, string> = {
  upcoming: "예정",
  today: "오늘",
  closed: "마감",
  done: "종료",
};

const STATUS_TONE: Record<ActivityStatus, "blue" | "green" | "orange" | "grey"> = {
  upcoming: "blue",
  today: "green",
  closed: "orange",
  done: "grey",
};

const EMPTY = {
  type: "총회" as ActivityType,
  title: "",
  date: "",
  date_label: "",
  time_label: "",
  place: "",
  target: "",
  tone: "sky" as ActivityTone,
  intro: "",
  notes: "",
};

interface Rsvp {
  activity_id: string;
  member_id: string;
  state: AttendState;
}

interface MemberName {
  id: string;
  name: string;
  cohort: string | null;
}

/** 응답을 펼쳐 볼 때의 묶음. 미응답은 따로 물어봐야 할 사람이라 끝에 둔다 */
const GROUPS: { key: AttendState | "미응답"; tone: "green" | "orange" | "grey" | "danger" }[] = [
  { key: "참석", tone: "green" },
  { key: "미정", tone: "orange" },
  { key: "불참", tone: "grey" },
  { key: "미응답", tone: "danger" },
];

/** 쉼표로 구분해 입력한 걸 배열로 — 상세 페이지의 안내 사항 목록이 된다 */
function toList(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ActivityAdmin() {
  const { readOnly, matches } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [members, setMembers] = useState<MemberName[]>([]);
  /** 응답자를 펼쳐 둔 활동 */
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /** 활동마다 참석·미정·불참·미응답 명단 */
  const responses = useMemo(() => {
    const byActivity = new Map<string, Map<string, AttendState>>();
    for (const r of rsvps) {
      if (!byActivity.has(r.activity_id)) byActivity.set(r.activity_id, new Map());
      byActivity.get(r.activity_id)!.set(r.member_id, r.state);
    }
    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name, "ko"));

    return (activityId: string) => {
      const answered = byActivity.get(activityId) ?? new Map<string, AttendState>();
      const out: Record<AttendState | "미응답", MemberName[]> = {
        참석: [],
        미정: [],
        불참: [],
        미응답: [],
      };
      for (const m of sorted) out[answered.get(m.id) ?? "미응답"].push(m);
      return out;
    };
  }, [rsvps, members]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  /** 수정 중인 활동 id. null 이면 새로 만드는 중이다 */
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error: fetchError }, { data: rsvpData }, { data: memberData }] =
        await Promise.all([
          supabase.from("activities").select("*").order("created_at", { ascending: false }),
          supabase.from("activity_rsvps").select("activity_id, member_id, state"),
          // 미응답을 가리려면 응답해야 할 사람 전체가 필요하다 — 승인된 부원만
          supabase.from("members").select("id, name, cohort").eq("status", "approved"),
        ]);
      if (cancelled) return;
      if (fetchError) {
        setError("활동을 불러오지 못했습니다.");
      } else {
        setRows((data ?? []) as ActivityRow[]);
      }
      setRsvps((rsvpData ?? []) as Rsvp[]);
      setMembers((memberData ?? []) as MemberName[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  /** 날짜를 고르면 화면 표기를 자동으로 채워 준다 — 요일을 손으로 적다 틀리는 걸 막는다 */
  function pickDate(iso: string) {
    if (!iso) {
      setForm((f) => ({ ...f, date: "", date_label: "" }));
      return;
    }
    const { dateLabel } = labelsFromDate(iso);
    setForm((f) => ({ ...f, date: iso, date_label: dateLabel }));
  }

  /** 만들기 폼을 그대로 수정에도 쓴다 — 같은 화면을 두 벌 만들지 않는다 */
  function startEdit(a: ActivityRow) {
    setEditingId(a.id);
    setForm({
      type: a.type,
      title: a.title,
      // 저장된 표기에서 날짜 입력칸 값을 되짚는다
      date: isoFromLabel(a.date_short),
      date_label: a.date_label,
      time_label: a.time_label,
      place: a.place,
      target: a.target,
      tone: a.tone,
      intro: a.intro,
      notes: a.notes.join(", "),
    });
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const { dateShort, weekday } = labelsFromDate(form.date);
    const payload = {
      type: form.type,
      title: form.title.trim(),
      date_label: form.date_label.trim(),
      date_short: dateShort,
      weekday,
      time_label: form.time_label.trim(),
      place: form.place.trim(),
      target: form.target.trim(),
      tone: form.tone,
      intro: form.intro.trim(),
      notes: toList(form.notes),
    };
    if (editingId) {
      const prev = rows;
      setRows((cur) =>
        cur.map((a) => (a.id === editingId ? ({ ...a, ...payload } as ActivityRow) : a)),
      );
      closeForm();
      const { error: updateError } = await supabase
        .from("activities")
        .update(payload)
        .eq("id", editingId);
      if (updateError) {
        setRows(prev);
        setError("수정하지 못했습니다. 다시 시도해 주세요.");
      }
      return;
    }

    const { data, error: insertError } = await supabase
      .from("activities")
      .insert(payload)
      .select()
      .single();

    if (insertError || !data) {
      setError("활동 등록에 실패했습니다. 다시 시도해 주세요.");
      return;
    }
    setRows((prev) => [data as ActivityRow, ...prev]);
    closeForm();
  }

  async function changeStatus(id: string, status: ActivityStatus) {
    const prev = rows;
    setRows((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
    const { error: updateError } = await supabase
      .from("activities")
      .update({ status })
      .eq("id", id);
    if (updateError) {
      setRows(prev);
      setError("상태를 바꾸지 못했습니다.");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("이 활동을 삭제할까요? 참석 응답과 조 편성도 함께 지워집니다.")) return;
    const prev = rows;
    setRows((cur) => cur.filter((a) => a.id !== id));
    const { error: deleteError } = await supabase.from("activities").delete().eq("id", id);
    if (deleteError) {
      setRows(prev);
      setError("삭제하지 못했습니다.");
    }
  }

  const canSubmit = form.title.trim() && form.date && form.place.trim();
  const visible = rows.filter((a) => matches(a.date_label));

  return (
    <Panel
      title="활동·행사"
      count={`${visible.length}건`}
      desc="총회·MT·개강파티처럼 부원이 참석 여부를 응답하는 동아리 행사입니다. 봉사활동은 [봉사활동 관리]에서 따로 등록합니다."
    >
      {error && <p className={tableStyles.muted}>{error}</p>}

      <div className={toolbar.toolbar}>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => (open ? closeForm() : setOpen(true))}
          disabled={readOnly && !open}
        >
          {open ? "닫기" : "＋ 활동 만들기"}
        </button>
      </div>

      {open && (
        <form className={styles.createForm} onSubmit={submit}>
          <div className={styles.formRow}>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>유형</span>
              <select
                className={styles.input}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ActivityType })}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>활동명</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 2학기 정기총회"
                required
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>날짜</span>
              <input
                className={styles.input}
                type="date"
                value={form.date}
                onChange={(e) => pickDate(e.target.value)}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>화면 표기</span>
              <input
                className={styles.input}
                value={form.date_label}
                onChange={(e) => setForm({ ...form, date_label: e.target.value })}
                placeholder="날짜를 고르면 자동으로 채워집니다"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>시간</span>
              <input
                className={styles.input}
                value={form.time_label}
                onChange={(e) => setForm({ ...form, time_label: e.target.value })}
                placeholder="예: 18:30 – 20:30"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.label}>장소</span>
              <input
                className={styles.input}
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                placeholder="예: 한성대 미래관 401호"
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>참여 대상</span>
              <input
                className={styles.input}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="예: 전 부원"
              />
            </label>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>색상</span>
              <select
                className={styles.input}
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value as ActivityTone })}
              >
                {ACTIVITY_TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>활동 소개</span>
            <input
              className={styles.input}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
              placeholder="부원들에게 보여줄 소개 문구"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>안내 사항 (쉼표로 구분)</span>
            <input
              className={styles.input}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="예: 전 부원 필참입니다., 회비 20,000원"
            />
          </label>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={cn(toolbar.button, toolbar.primary)}
              disabled={!canSubmit}
            >
              {editingId ? "수정 저장" : "만들기"}
            </button>
            <button type="button" className={toolbar.button} onClick={closeForm}>
              취소
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={["유형", "활동명", "날짜", "장소", "참석", "상태", ""]}
        isEmpty={!loading && visible.length === 0}
        empty={loading ? "불러오는 중..." : "등록된 활동이 없습니다."}
      >
        {visible.map((a) => (
          <Fragment key={a.id}>
          <tr>
            <td>
              <Badge tone="blue">{a.type}</Badge>
            </td>
            <td>{a.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.date_label}</td>
            <td className={tableStyles.muted}>{a.place}</td>
            <td className={tableStyles.numeric}>
              <button
                type="button"
                className={rsvpStyles.countButton}
                onClick={() => setExpanded((cur) => (cur === a.id ? null : a.id))}
                aria-expanded={expanded === a.id}
                aria-label={`${a.title} 응답자 ${expanded === a.id ? "접기" : "펼치기"}`}
              >
                {responses(a.id).참석.length}명
                <span className={rsvpStyles.chevron} aria-hidden="true">
                  {expanded === a.id ? "▴" : "▾"}
                </span>
              </button>
            </td>
            <td>
              <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
            </td>
            <td className={styles.rowActions}>
              <select
                className={toolbar.select}
                value={a.status}
                onChange={(e) => changeStatus(a.id, e.target.value as ActivityStatus)}
                disabled={readOnly}
                aria-label={`${a.title} 상태 변경`}
              >
                {(Object.keys(STATUS_LABEL) as ActivityStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <RowAction onClick={() => startEdit(a)} disabled={readOnly}>
                수정
              </RowAction>
              <RowAction onClick={() => remove(a.id)} disabled={readOnly}>
                삭제
              </RowAction>
            </td>
          </tr>
          {expanded === a.id && (
            <tr className={rsvpStyles.detailRow}>
              {/* 표의 칸 수와 같아야 한 줄을 다 쓴다 */}
              <td colSpan={7}>
                <div className={rsvpStyles.groups}>
                  {GROUPS.map((g) => {
                    const people = responses(a.id)[g.key];
                    return (
                      <div key={g.key} className={rsvpStyles.group}>
                        <div className={rsvpStyles.groupHead}>
                          <Badge tone={g.tone}>{g.key}</Badge>
                          <span className={rsvpStyles.groupCount}>{people.length}명</span>
                        </div>
                        {people.length > 0 ? (
                          <p className={rsvpStyles.names}>
                            {people.map((m) => m.name).join(" · ")}
                          </p>
                        ) : (
                          <p className={rsvpStyles.none}>없음</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>
          )}
          </Fragment>
        ))}
      </DataTable>
    </Panel>
  );
}
