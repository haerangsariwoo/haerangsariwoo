"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { partners as seed } from "@/lib/admin-data";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

const EMPTY = { name: "", contact: "", since: String(new Date().getFullYear()) };

export function PartnerTable() {
  const { readOnly } = useSemester();
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  /** 수정 중인 행. null 이면 새로 등록 */
  const [editing, setEditing] = useState<string | null>(null);

  const visible = rows.filter((p) => !q.trim() || p.name.includes(q.trim()));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      setRows((prev) =>
        prev.map((p) =>
          p.id === editing
            ? { ...p, name: form.name.trim(), contact: form.contact.trim(), since: form.since }
            : p,
        ),
      );
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: `p${Date.now()}`,
          name: form.name.trim(),
          contact: form.contact.trim(),
          activities: 0,
          since: form.since,
        },
      ]);
    }
    setForm(EMPTY);
    setEditing(null);
    setOpen(false);
  }

  function startEdit(id: string) {
    const p = rows.find((x) => x.id === id);
    if (!p) return;
    setForm({ name: p.name, contact: p.contact, since: p.since });
    setEditing(id);
    setOpen(true);
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <div className={toolbar.toolbar}>
        <input
          className={toolbar.search}
          placeholder="기관명 검색"
          aria-label="기관 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => {
            setEditing(null);
            setForm(EMPTY);
            setOpen((o) => !o);
          }}
          disabled={readOnly && !open}
        >
          {open && !editing ? "닫기" : "＋ 기관 등록"}
        </button>
      </div>

      {open && (
        <form className={styles.createForm} onSubmit={submit}>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.label}>기관명</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="예: 성북구 자원봉사센터"
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>연락처</span>
              <input
                className={styles.input}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="02-000-0000"
              />
            </label>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>협력 시작</span>
              <input
                className={styles.input}
                value={form.since}
                onChange={(e) => setForm({ ...form, since: e.target.value })}
                placeholder="2026"
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={cn(toolbar.button, toolbar.primary)}
              disabled={!form.name.trim()}
            >
              {editing ? "수정 저장" : "등록"}
            </button>
            <button
              type="button"
              className={toolbar.button}
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              취소
            </button>
          </div>
        </form>
      )}

      <DataTable columns={["기관명", "연락처", "누적 활동", "협력 시작", ""]}>
        {visible.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.contact}</td>
            <td className={tableStyles.numeric}>{p.activities}회</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.since}년</td>
            <td className={styles.rowActions}>
              <RowAction onClick={() => startEdit(p.id)} disabled={readOnly}>
                수정
              </RowAction>
              <RowAction onClick={() => remove(p.id)} disabled={readOnly}>
                삭제
              </RowAction>
            </td>
          </tr>
        ))}
        {visible.length === 0 && (
          <tr>
            <td colSpan={5} className={tableStyles.muted}>
              조건에 맞는 기관이 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
