"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import {
  ACTIVITY_TONES,
  ACTIVITY_TYPES,
  labelsFromDate,
  type ActivityStatus,
  type ActivityTone,
  type ActivityType,
} from "@/lib/activities";
import type { ActivityRow } from "@/lib/activity-queries";
import { isoFromLabel } from "@/lib/semester";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

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
  const [attending, setAttending] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  /** 수정 중인 활동 id. null 이면 새로 만드는 중이다 */
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error: fetchError }, { data: rsvps }] = await Promise.all([
        supabase.from("activities").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_rsvps").select("activity_id, state"),
      ]);
      if (cancelled) return;
      if (fetchError) {
        setError("활동을 불러오지 못했습니다.");
      } else {
        setRows((data ?? []) as ActivityRow[]);
      }
      const counts: Record<string, number> = {};
      for (const r of (rsvps ?? []) as { activity_id: string; state: string }[]) {
        if (r.state === "참석") counts[r.activity_id] = (counts[r.activity_id] ?? 0) + 1;
      }
      setAttending(counts);
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
          <tr key={a.id}>
            <td>
              <Badge tone="blue">{a.type}</Badge>
            </td>
            <td>{a.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.date_label}</td>
            <td className={tableStyles.muted}>{a.place}</td>
            <td className={tableStyles.numeric}>{attending[a.id] ?? 0}명</td>
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
        ))}
      </DataTable>
    </Panel>
  );
}
