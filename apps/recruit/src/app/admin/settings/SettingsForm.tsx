"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Panel, ui } from "@/components/admin/Panel";
import { createClient } from "@/lib/supabase/client";
import type { RecruitSettings } from "@/lib/content-queries";
import type { FormField } from "@/lib/recruit-config";
import { formatLock } from "@/lib/interview-lock";
import { applyPhase, formatDayTime, fromLocalInput, toLocalInput } from "@/lib/schedule";
import styles from "./settings.module.css";

const SCHEDULE_KEYS = [
  ["applyStart", "apply_start", "지원 시작"],
  ["applyEnd", "apply_end", "지원 마감"],
  ["firstResultDate", "first_result_date", "1차 발표"],
  ["interviewRange", "interview_range", "면접 기간"],
  ["finalResultDate", "final_result_date", "최종 발표"],
] as const;

/**
 * 실제로 동작하는 시각들. 위의 SCHEDULE_KEYS 는 화면에 보여줄 글자일 뿐이고,
 * 여기 값을 넣으면 그 시각에 접수가 열리고 닫히고 결과가 발표된다.
 */
const TIME_KEYS = [
  ["apply_start_at", "접수 시작"],
  ["apply_end_at", "접수 마감"],
  ["first_result_at", "1차 발표 예약"],
  ["final_result_at", "최종 발표 예약"],
] as const;

const PHASE_LABEL = { before: "접수 전", open: "접수 중", closed: "접수 마감" } as const;

const FIELD_TYPES: FormField["type"][] = ["text", "tel", "number", "textarea"];

interface Props {
  settings: RecruitSettings;
  initialFields: FormField[];
}

export function SettingsForm({ settings, initialFields }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(settings.applicationsOpen);
  const [cohort, setCohort] = useState(settings.cohortLabelText);
  const [lockAt, setLockAt] = useState(toLocalInput(settings.interviewLockAt));
  /** 정해두면 그 시각에 스스로 열리고 닫히고 발표된다 */
  const [times, setTimes] = useState({
    apply_start_at: toLocalInput(settings.applyStartAt),
    apply_end_at: toLocalInput(settings.applyEndAt),
    first_result_at: toLocalInput(settings.firstResultAt),
    final_result_at: toLocalInput(settings.finalResultAt),
  });
  const [schedule, setSchedule] = useState<Record<string, string>>(
    Object.fromEntries(SCHEDULE_KEYS.map(([key]) => [key, settings[key]])),
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [fieldsDirty, setFieldsDirty] = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);

  /** 접수 on/off 는 바로 반영되어야 하는 스위치라 누르는 즉시 저장한다 */
  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    const { error: updateError } = await supabase
      .from("recruit_settings")
      .update({ applications_open: next })
      .eq("id", 1);
    if (updateError) {
      setOpen(!next);
      setError("접수 상태를 바꾸지 못했습니다.");
    }
  }

  async function save() {
    setError(null);
    const payload: Record<string, string | null> = { cohort_label: cohort.trim() };
    SCHEDULE_KEYS.forEach(([key, column]) => {
      payload[column] = schedule[key]?.trim() ?? "";
    });
    payload.interview_lock_at = fromLocalInput(lockAt);
    for (const [column, value] of Object.entries(times)) {
      payload[column] = fromLocalInput(value);
    }

    const { error: updateError } = await supabase
      .from("recruit_settings")
      .update(payload)
      .eq("id", 1);
    if (updateError) {
      setError("저장하지 못했습니다.");
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  }

  function startEdit(f: FormField) {
    setEditing(f.name);
    setDraft(f.label);
  }

  function commitEdit(name: string) {
    setFields((prev) => prev.map((f) => (f.name === name ? { ...f, label: draft.trim() } : f)));
    setEditing(null);
    setFieldsDirty(true);
  }

  function addField() {
    const n = fields.length + 1;
    setFields((prev) => [
      ...prev,
      {
        name: `custom${Date.now()}`,
        label: `새 문항 ${n}`,
        placeholder: "",
        type: "text",
        required: false,
      },
    ]);
    setFieldsDirty(true);
  }

  function removeField(name: string) {
    setFields((prev) => prev.filter((f) => f.name !== name));
    setFieldsDirty(true);
  }

  function toggleRequired(name: string) {
    setFields((prev) => prev.map((f) => (f.name === name ? { ...f, required: !f.required } : f)));
    setFieldsDirty(true);
  }

  function changeType(name: string, type: FormField["type"]) {
    setFields((prev) =>
      prev.map((f) =>
        f.name === name
          ? { ...f, type, maxLength: type === "textarea" ? (f.maxLength ?? 300) : undefined }
          : f,
      ),
    );
    setFieldsDirty(true);
  }

  /** 문항은 순서까지 함께 저장해야 해서 통째로 지우고 다시 넣는다 */
  async function saveFields() {
    setError(null);
    const { error: deleteError } = await supabase
      .from("application_fields")
      .delete()
      .not("name", "is", null);
    if (deleteError) {
      setError("문항을 저장하지 못했습니다.");
      return;
    }

    if (fields.length > 0) {
      const { error: insertError } = await supabase.from("application_fields").insert(
        fields.map((f, i) => ({
          name: f.name,
          label: f.label,
          placeholder: f.placeholder,
          field_type: f.type,
          required: f.required,
          max_length: f.maxLength ?? null,
          sort_order: i,
        })),
      );
      if (insertError) {
        setError("문항을 저장하지 못했습니다.");
        return;
      }
    }

    setFieldsDirty(false);
    setFieldsSaved(true);
    window.setTimeout(() => setFieldsSaved(false), 2400);
  }

  /*
   * 지금 실제로 접수를 받는 상태인지 그 자리에서 보여준다.
   *
   * 토글은 "이번 모집을 진행하는가", 시각은 "언제부터 언제까지" 라서
   * 토글만 보고는 지금 열려 있는지 알 수 없다. 시작 시각이 지나면 이
   * 표시가 저절로 "접수 중" 으로 바뀐다.
   */
  const startAt = fromLocalInput(times.apply_start_at);
  const endAt = fromLocalInput(times.apply_end_at);
  const phase = applyPhase({ applicationsOpen: open, applyStartAt: startAt, applyEndAt: endAt });

  const phaseDesc = !open
    ? "접수를 꺼두면 시각을 정해두었더라도 열리지 않습니다. 사고가 났을 때 즉시 막는 수단입니다."
    : phase === "before"
      ? startAt
        ? `${formatDayTime(startAt)} 부터 지원서를 받습니다.`
        : "시작 시각을 정하지 않아 아직 열리지 않았습니다."
      : phase === "closed"
        ? `${formatDayTime(endAt)} 에 마감됐습니다.`
        : endAt
          ? `${formatDayTime(endAt)} 까지 지원서를 받습니다.`
          : "마감 시각을 정하지 않아 계속 열려 있습니다.";

  return (
    <>
      {error && <p className={styles.savedNote}>{error}</p>}

      <Panel
        title="접수 상태"
        desc="접수를 끄면 랜딩 소개는 그대로 공개되고 지원 버튼만 비활성화됩니다."
      >
        <div className={styles.toggleRow}>
          <div className={styles.toggleText}>
            <p className={styles.toggleTitle}>
              지원 접수 {open ? "받는 중" : "중지"}
              <span className={cn(styles.phaseTag, phase === "open" && styles.phaseOpen)}>
                지금 {PHASE_LABEL[phase]}
              </span>
            </p>
            <p className={styles.toggleDesc}>
              {phaseDesc}
            </p>
          </div>
          <button
            type="button"
            className={cn(styles.switch, !open && styles.off)}
            aria-pressed={open}
            aria-label="지원 접수 토글"
            onClick={toggleOpen}
          >
            <span className={styles.knob} />
          </button>
        </div>
      </Panel>

      <div className={styles.row}>
        <Panel title="기수 · 일정" desc="고정값 없이 학기마다 수정합니다.">
          <div className={styles.fieldList}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cohort">
                기수
              </label>
              <input
                id="cohort"
                className={styles.input}
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="예: 26-2기 · 2026학년도 2학기"
              />
            </div>
            {SCHEDULE_KEYS.map(([key, , label]) => (
              <div key={key} className={styles.field}>
                <label className={styles.label} htmlFor={key}>
                  {label}
                </label>
                <input
                  id={key}
                  className={styles.input}
                  value={schedule[key] ?? ""}
                  onChange={(e) => setSchedule({ ...schedule, [key]: e.target.value })}
                />
              </div>
            ))}
            {TIME_KEYS.map(([column, label]) => (
              <div key={column} className={styles.field}>
                <label className={styles.label} htmlFor={column}>
                  {label}
                </label>
                <input
                  id={column}
                  type="datetime-local"
                  className={styles.input}
                  value={times[column]}
                  onChange={(e) => setTimes({ ...times, [column]: e.target.value })}
                />
              </div>
            ))}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="interview-lock">
                면접 시간 변경 마감
              </label>
              <input
                id="interview-lock"
                type="datetime-local"
                className={styles.input}
                value={lockAt}
                onChange={(e) => setLockAt(e.target.value)}
              />
            </div>
          </div>
          <p className={styles.lockNote}>
            접수 시작·마감을 넣으면 그 시각에 지원서 접수가 스스로 열리고 닫힙니다 (위쪽
            접수 토글보다 우선합니다). 발표 예약은 그 시각이 되면 자동으로 공개하되,
            심사가 끝나지 않았으면 열지 않습니다. 비워두면 지금처럼 손으로 조작합니다.
          </p>
          <p className={styles.lockNote}>
            {lockAt
              ? `${formatLock(fromLocalInput(lockAt))} 부터 이미 시간을 고른 지원자는 바꿀 수 없습니다. 아직 안 고른 지원자는 그 뒤에도 고를 수 있습니다.`
              : "비워두면 잠그지 않습니다. 면접 시작 시각을 넣어두면 그때부터 변경이 막힙니다."}
          </p>
          <div className={ui.toolbar} style={{ marginTop: 16, marginBottom: 0 }}>
            <span className={ui.spacer} />
            {saved && <span className={styles.savedNote}>저장했습니다</span>}
            <button type="button" className={cn(ui.btn, ui.primary)} onClick={save}>
              저장
            </button>
          </div>
        </Panel>

        <Panel title="지원서 문항" desc="저장하면 지원 화면에 그대로 반영됩니다.">
          <div className={styles.questionList}>
            {fields.map((f) => (
              <div key={f.name} className={styles.question}>
                {editing === f.name ? (
                  <input
                    className={styles.input}
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(f.name);
                      if (e.key === "Escape") setEditing(null);
                    }}
                    onBlur={() => commitEdit(f.name)}
                    aria-label="문항 이름"
                  />
                ) : (
                  <span className={styles.qLabel}>{f.label}</span>
                )}
                <select
                  className={styles.qType}
                  value={f.type}
                  onChange={(e) => changeType(f.name, e.target.value as FormField["type"])}
                  aria-label={`${f.label} 입력 형식`}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "textarea" ? "서술형" : t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={ui.rowBtn}
                  onClick={() => toggleRequired(f.name)}
                  title="눌러서 필수 여부 변경"
                >
                  {f.required ? "필수" : "선택"}
                </button>
                <button type="button" className={ui.rowBtn} onClick={() => startEdit(f)}>
                  수정
                </button>
                <button type="button" className={ui.rowBtn} onClick={() => removeField(f.name)}>
                  삭제
                </button>
              </div>
            ))}
            {fields.length === 0 && <p className={styles.toggleDesc}>문항이 없습니다.</p>}
          </div>
          <div className={ui.toolbar} style={{ marginTop: 16, marginBottom: 0 }}>
            <button type="button" className={ui.btn} onClick={addField}>
              ＋ 문항 추가
            </button>
            <span className={ui.spacer} />
            {fieldsSaved && <span className={styles.savedNote}>저장했습니다</span>}
            <button
              type="button"
              className={cn(ui.btn, ui.primary)}
              onClick={saveFields}
              disabled={!fieldsDirty}
            >
              문항 저장
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
