"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import { boardPosts as seed } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

const CAT_TONE: Record<string, BadgeTone> = {
  회의록: "blue",
  "운영 공지": "orange",
  자료: "green",
  자유: "grey",
};

const CATEGORIES = ["회의록", "운영 공지", "자료", "자유"] as const;

export function BoardTable() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  type Category = (typeof CATEGORIES)[number];
  const [cat, setCat] = useState<"all" | Category>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0] as Category, body: "" });
  /** 펼쳐서 본문을 보고 있는 글 */
  const [reading, setReading] = useState<string | null>(null);

  /** 검색어만 반영한 목록 — 칩의 건수가 "지금 검색어로 이 카테고리엔 몇 건" 을 보여주게 한다 */
  const bySearch = rows.filter(
    (p) => !q.trim() || p.title.includes(q.trim()) || p.author.includes(q.trim()),
  );
  const visible = bySearch.filter((p) => cat === "all" || p.category === cat);

  const countFor = (c: "all" | Category) =>
    c === "all" ? bySearch.length : bySearch.filter((p) => p.category === c).length;

  function create(e: FormEvent) {
    e.preventDefault();
    const d = new Date();
    setRows((prev) => [
      {
        id: `b${Date.now()}`,
        category: form.category,
        title: form.title.trim(),
        author: "김우영 운영진",
        date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
        files: 0,
      },
      ...prev,
    ]);
    setForm({ title: "", category: CATEGORIES[0], body: "" });
    setOpen(false);
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <div className={toolbar.toolbar}>
        <input
          className={toolbar.search}
          placeholder="제목·작성자 검색"
          aria-label="게시글 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "닫기" : "＋ 글 작성"}
        </button>
      </div>

      {/* 카테고리별로 나눠 본다. select 뒤에 숨어 있던 걸 항상 보이는
          칩으로 꺼내고, 칩마다 지금 검색어 기준 건수를 붙였다. */}
      <div className={toolbar.chipRow} role="tablist" aria-label="카테고리">
        <button
          type="button"
          role="tab"
          aria-selected={cat === "all"}
          className={cn(toolbar.chip, cat === "all" && toolbar.chipActive)}
          onClick={() => setCat("all")}
        >
          전체
          <span className={toolbar.chipCount}>{countFor("all")}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cat === c}
            className={cn(toolbar.chip, cat === c && toolbar.chipActive)}
            onClick={() => setCat(c)}
          >
            {c}
            <span className={toolbar.chipCount}>{countFor(c)}</span>
          </button>
        ))}
      </div>

      {open && (
        <form className={styles.createForm} onSubmit={create}>
          <div className={styles.formRow}>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>카테고리</span>
              <select
                className={styles.input}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>제목</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 9월 정기 회의록"
                required
              />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.label}>내용</span>
            <textarea
              className={styles.input}
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="회의 내용이나 자료 설명을 적어주세요."
            />
          </label>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={cn(toolbar.button, toolbar.primary)}
              disabled={!form.title.trim()}
            >
              등록
            </button>
            <button type="button" className={toolbar.button} onClick={() => setOpen(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      <DataTable columns={["카테고리", "제목", "작성자", "작성일", "첨부", ""]}>
        {visible.map((p) => (
          <tr key={p.id}>
            <td>
              <Badge tone={CAT_TONE[p.category]}>{p.category}</Badge>
            </td>
            <td>
              {p.title}
              {reading === p.id && (
                <p className={tableStyles.muted}>본문은 Supabase 연동 후 저장·표시됩니다.</p>
              )}
            </td>
            <td className={tableStyles.muted}>{p.author}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.date}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>
              {p.files > 0 ? `${p.files}개` : "—"}
            </td>
            <td className={styles.rowActions}>
              <RowAction onClick={() => setReading((r) => (r === p.id ? null : p.id))}>
                {reading === p.id ? "접기" : "열기"}
              </RowAction>
              <RowAction onClick={() => remove(p.id)}>삭제</RowAction>
            </td>
          </tr>
        ))}
        {visible.length === 0 && (
          <tr>
            <td colSpan={6} className={tableStyles.muted}>
              조건에 맞는 글이 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
