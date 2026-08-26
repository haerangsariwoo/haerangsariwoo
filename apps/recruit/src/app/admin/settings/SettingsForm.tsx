"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Panel, ui } from "@/components/admin/Panel";
import { createClient } from "@/lib/supabase/client";
import type { RecruitSettings } from "@/lib/content-queries";
import type { FormField } from "@/lib/recruit-config";
import styles from "./settings.module.css";

const SCHEDULE_KEYS = [
  ["applyStart", "apply_start", "지원 시작"],
  ["applyEnd", "apply_end", "지원 마감"],
  ["firstResultDate", "first_result_date", "1차 발표"],
  ["interviewRange", "interview_range", "면접 기간"],
  ["finalResultDate", "final_result_date", "최종 발표"],
] as const;

const FIELD_TYPES: FormField["type"][] = ["text", "tel", "number", "textarea"];

interface Props {
  settings: RecruitSettings;
  initialFields: FormField[];
}

export function SettingsForm({ settings, initialFields }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(settings.applicationsOpen);
  const [cohort, setCohort] = useState(settings.cohortLabelText);
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
    const payload: Record<string, string> = { cohort_label: cohort.trim() };
    SCHEDULE_KEYS.forEach(([key, column]) => {
      payload[column] = schedule[key]?.trim() ?? "";
    });

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

  return (
    <>
      {error && <p className={styles.savedNote}>{error}</p>}

      <Panel
        title="접수 상태"
        desc="접수를 끄면 랜딩 소개는 그대로 공개되고 지원 버튼만 비활성화됩니다."
      >
        <div className={styles.toggleRow}>
          <div className={styles.toggleText}>
            <p className={styles.toggleTitle}>지원 접수 {open ? "받는 중" : "중지"}</p>
            <p className={styles.toggleDesc}>
              오프시즌에도 랜딩은 상시 공개됩니다. 접수를 끄면 지원자에게 &ldquo;모집 준비
              중&rdquo;으로 표시됩니다.
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
          </div>
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
