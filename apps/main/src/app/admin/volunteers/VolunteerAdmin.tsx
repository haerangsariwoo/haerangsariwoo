"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { adminVolunteers as seed, type AdminVolunteer } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./volunteers.module.css";

const EMPTY = {
  title: "",
  date: "",
  place: "",
  capacity: "15",
  creditHours: "3",
};

export function VolunteerAdmin() {
  const [rows, setRows] = useState<AdminVolunteer[]>(seed);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const visible = rows.filter((v) => {
    const hitQ = !q.trim() || v.title.includes(q.trim()) || v.place.includes(q.trim());
    const hitSrc = source === "all" || v.source === source;
    const hitSt =
      status === "all" ||
      (status === "open" ? v.status !== "모집 마감" : v.status === "모집 마감");
    return hitQ && hitSrc && hitSt;
  });

  function create(e: FormEvent) {
    e.preventDefault();
    const cap = Number(form.capacity) || 0;
    setRows((prev) => [
      {
        id: `v${Date.now()}`,
        title: form.title.trim(),
        date: form.date.trim(),
        place: form.place.trim(),
        applied: 0,
        capacity: cap,
        creditHours: Number(form.creditHours) || 0,
        source: "내부",
        status: "모집 중",
        tone: "blue",
      },
      ...prev,
    ]);
    setForm(EMPTY);
    setOpen(false);
  }

  /** 모집 중 ↔ 모집 마감 */
  function toggleStatus(id: string) {
    setRows((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const closed = v.status === "모집 마감";
        return closed
          ? { ...v, status: v.applied >= v.capacity ? "마감 임박" : "모집 중", tone: "blue" }
          : { ...v, status: "모집 마감", tone: "grey" };
      }),
    );
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((v) => v.id !== id));
  }

  const canSubmit = form.title.trim() && form.date.trim() && form.place.trim();

  return (
    <>
      <div className={toolbar.toolbar}>
        <input
          className={toolbar.search}
          placeholder="봉사명·장소 검색"
          aria-label="봉사 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={toolbar.select}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          aria-label="출처 필터"
        >
          <option value="all">출처: 전체</option>
          <option value="내부">내부</option>
          <option value="1365">1365</option>
          <option value="VMS">VMS</option>
        </select>
        <select
          className={toolbar.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="상태 필터"
        >
          <option value="all">상태: 전체</option>
          <option value="open">모집 중</option>
          <option value="closed">모집 마감</option>
        </select>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "닫기" : "＋ 봉사활동 만들기"}
        </button>
      </div>

      {open && (
        <form className={styles.createForm} onSubmit={create}>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.label}>봉사명</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 성북천 플로깅"
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>일시</span>
              <input
                className={styles.input}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="예: 9.20 (토)"
                required
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
                placeholder="예: 성북천 분수마루 앞"
                required
              />
            </label>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>정원</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </label>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>인정시간</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.creditHours}
                onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={cn(toolbar.button, toolbar.primary)} disabled={!canSubmit}>
              만들기
            </button>
            <button type="button" className={toolbar.button} onClick={() => setOpen(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={["봉사활동", "일시", "장소", "신청/정원", "인정시간", "출처", "상태", ""]}
      >
        {visible.map((v) => (
          <tr key={v.id}>
            <td>{v.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{v.date}</td>
            <td className={tableStyles.muted}>{v.place}</td>
            <td className={tableStyles.numeric}>
              {v.applied} / {v.capacity}
            </td>
            <td className={tableStyles.numeric}>{v.creditHours}시간</td>
            <td>
              <Badge tone={v.source === "내부" ? "blue" : "grey"}>{v.source}</Badge>
            </td>
            <td>
              <Badge tone={v.tone}>{v.status}</Badge>
            </td>
            <td className={styles.rowActions}>
              <RowAction onClick={() => toggleStatus(v.id)}>
                {v.status === "모집 마감" ? "재개" : "마감"}
              </RowAction>
              <RowAction onClick={() => remove(v.id)}>삭제</RowAction>
            </td>
          </tr>
        ))}
        {visible.length === 0 && (
          <tr>
            <td colSpan={8} className={tableStyles.muted}>
              조건에 맞는 봉사활동이 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
