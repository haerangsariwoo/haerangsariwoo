"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Panel, ui } from "@/components/admin/Panel";
import {
  applicationFields,
  cohortLabel,
  motivationField,
  recruitConfig,
  type FormField,
} from "@/lib/recruit-config";
import styles from "./settings.module.css";

const SCHEDULE_KEYS = [
  ["applyStart", "지원 시작"],
  ["applyEnd", "지원 마감"],
  ["firstResultDate", "1차 발표"],
  ["interviewRange", "면접 기간"],
  ["finalResultDate", "최종 발표"],
] as const;

export function SettingsForm() {
  const [open, setOpen] = useState(recruitConfig.applicationsOpen);
  const [cohort, setCohort] = useState(
    `${cohortLabel(recruitConfig.year, recruitConfig.semesterNo)} · ${recruitConfig.semester}`,
  );
  const [schedule, setSchedule] = useState<Record<string, string>>(
    Object.fromEntries(SCHEDULE_KEYS.map(([k]) => [k, recruitConfig[k]])),
  );
  const [saved, setSaved] = useState(false);

  const [fields, setFields] = useState<FormField[]>([...applicationFields, motivationField]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function save() {
    // 실제 저장은 Supabase 연동 후. 지금은 화면 안에서만 유지된다.
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
  }

  function addField() {
    const n = fields.length + 1;
    setFields((prev) => [
      ...prev,
      {
        name: `custom${n}`,
        label: `새 문항 ${n}`,
        placeholder: "",
        type: "text",
        required: false,
      },
    ]);
  }

  function removeField(name: string) {
    setFields((prev) => prev.filter((f) => f.name !== name));
  }

  function toggleRequired(name: string) {
    setFields((prev) =>
      prev.map((f) => (f.name === name ? { ...f, required: !f.required } : f)),
    );
  }

  return (
    <>
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
            onClick={() => setOpen((o) => !o)}
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
              />
            </div>
            {SCHEDULE_KEYS.map(([key, label]) => (
              <div key={key} className={styles.field}>
                <label className={styles.label} htmlFor={key}>
                  {label}
                </label>
                <input
                  id={key}
                  className={styles.input}
                  value={schedule[key]}
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

        <Panel title="지원서 문항" desc="문항을 추가·수정하면 지원 화면에 즉시 반영됩니다.">
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
                <button
                  type="button"
                  className={styles.qType}
                  onClick={() => toggleRequired(f.name)}
                  title="눌러서 필수 여부 변경"
                >
                  {f.type === "textarea" ? `서술 · ${f.maxLength}자` : f.type}
                  {f.required ? " · 필수" : " · 선택"}
                </button>
                <button type="button" className={ui.rowBtn} onClick={() => startEdit(f)}>
                  수정
                </button>
                <button type="button" className={ui.rowBtn} onClick={() => removeField(f.name)}>
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div className={ui.toolbar} style={{ marginTop: 16, marginBottom: 0 }}>
            <button type="button" className={ui.btn} onClick={addField}>
              ＋ 문항 추가
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
