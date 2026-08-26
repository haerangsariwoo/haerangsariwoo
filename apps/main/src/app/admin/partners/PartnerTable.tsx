"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

interface PartnerRow {
  id: string;
  name: string;
  contact: string;
  since_year: string;
}

const EMPTY = { name: "", contact: "", since_year: String(new Date().getFullYear()) };

export function PartnerTable() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<PartnerRow[]>([]);
  /** 기관별 누적 활동 수 — 내부봉사에 어느 기관을 걸어뒀는지로 자동 집계한다 */
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  /** 수정 중인 행. null 이면 새로 등록 */
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error: fetchError }, { data: acts }] = await Promise.all([
        supabase.from("partners").select("*").order("created_at", { ascending: true }),
        supabase.from("internal_activities").select("partner_id"),
      ]);
      if (cancelled) return;
      if (fetchError) setError("협력기관을 불러오지 못했습니다.");
      else setRows((data ?? []) as PartnerRow[]);

      const tally: Record<string, number> = {};
      for (const a of (acts ?? []) as { partner_id: string | null }[]) {
        if (a.partner_id) tally[a.partner_id] = (tally[a.partner_id] ?? 0) + 1;
      }
      setCounts(tally);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const visible = rows.filter((p) => !q.trim() || p.name.includes(q.trim()));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      since_year: form.since_year.trim(),
    };

    if (editing) {
      const prev = rows;
      setRows((cur) => cur.map((p) => (p.id === editing ? { ...p, ...payload } : p)));
      const { error: updateError } = await supabase
        .from("partners")
        .update(payload)
        .eq("id", editing);
      if (updateError) {
        setRows(prev);
        setError("수정하지 못했습니다.");
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("partners")
        .insert(payload)
        .select()
        .single();
      if (insertError || !data) {
        setError("등록하지 못했습니다.");
        return;
      }
      setRows((cur) => [...cur, data as PartnerRow]);
    }

    setForm(EMPTY);
    setEditing(null);
    setOpen(false);
  }

  function startEdit(id: string) {
    const p = rows.find((x) => x.id === id);
    if (!p) return;
    setForm({ name: p.name, contact: p.contact, since_year: p.since_year });
    setEditing(id);
    setOpen(true);
  }

  async function remove(id: string) {
    if (!window.confirm("이 기관을 삭제할까요? 연결된 봉사활동에서는 기관 표시만 사라집니다."))
      return;
    const prev = rows;
    setRows((cur) => cur.filter((p) => p.id !== id));
    const { error: deleteError } = await supabase.from("partners").delete().eq("id", id);
    if (deleteError) {
      setRows(prev);
      setError("삭제하지 못했습니다. 이 기관이 걸린 봉사활동이 있는지 확인해 주세요.");
    }
  }

  return (
    <Panel
      title="협력기관"
      count={`${rows.length}곳`}
      desc="누적 활동은 [봉사활동 관리]에서 기관을 지정한 내부봉사 수로 자동 집계됩니다."
    >
      {error && <p className={tableStyles.muted}>{error}</p>}

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
                value={form.since_year}
                onChange={(e) => setForm({ ...form, since_year: e.target.value })}
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

      <DataTable
        columns={["기관명", "연락처", "누적 활동", "협력 시작", ""]}
        isEmpty={!loading && visible.length === 0}
        empty={loading ? "불러오는 중..." : "등록된 기관이 없습니다."}
      >
        {visible.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.contact || "—"}</td>
            <td className={tableStyles.numeric}>{counts[p.id] ?? 0}회</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>
              {p.since_year ? `${p.since_year}년` : "—"}
            </td>
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
      </DataTable>
    </Panel>
  );
}
