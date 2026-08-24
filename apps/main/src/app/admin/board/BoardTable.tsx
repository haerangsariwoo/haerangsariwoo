"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import { boardPosts as seed } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import formStyles from "../volunteers/volunteers.module.css";
import styles from "./BoardTable.module.css";

const CAT_TONE: Record<string, BadgeTone> = {
  회의록: "blue",
  "운영 공지": "orange",
  자료: "green",
  자유: "grey",
};

const CATEGORIES = ["회의록", "운영 공지", "자료", "자유"] as const;
type Category = (typeof CATEGORIES)[number];

/**
 * 카페처럼 게시판을 폴더로 늘어놓고, 눌러서 들어간 게시판의 글만 보여준다.
 * "전체글" 은 실제 게시판이 아니라 폴더 목록 맨 위에 있는 통합 보기다
 * (네이버 카페의 "전체글보기" 와 같은 자리).
 */
export function BoardTable() {
  const [rows, setRows] = useState(seed);
  const [openBoard, setOpenBoard] = useState<"all" | Category | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0] as Category, body: "" });
  /** 펼쳐서 본문을 보고 있는 글 */
  const [reading, setReading] = useState<string | null>(null);

  const countOf = (c: Category) => rows.filter((p) => p.category === c).length;
  const latestOf = (c: Category) => rows.find((p) => p.category === c) ?? null;

  const inBoard = openBoard !== null;
  const bySearch = rows.filter(
    (p) => !q.trim() || p.title.includes(q.trim()) || p.author.includes(q.trim()),
  );
  const visible = bySearch.filter((p) => openBoard === "all" || p.category === openBoard);

  function enter(board: "all" | Category) {
    setOpenBoard(board);
    setQ("");
    setReading(null);
  }

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
    setForm({ title: "", category: form.category, body: "" });
    setOpen(false);
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((p) => p.id !== id));
  }

  /* ---------- 폴더 목록 ---------- */
  if (!inBoard) {
    return (
      <div className={styles.folderList}>
        <button type="button" className={styles.folderRow} onClick={() => enter("all")}>
          <span className={cn(styles.folderIcon, styles.blue)} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
            </svg>
          </span>
          <span className={styles.folderName}>전체글</span>
          <span className={styles.folderCount}>{rows.length}</span>
          <span className={styles.folderLatest} />
          <span className={styles.folderChevron} aria-hidden="true">›</span>
        </button>

        {CATEGORIES.map((c) => {
          const latest = latestOf(c);
          return (
            <button key={c} type="button" className={styles.folderRow} onClick={() => enter(c)}>
              <span className={cn(styles.folderIcon, styles[CAT_TONE[c]])} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                </svg>
              </span>
              <span className={styles.folderName}>{c}</span>
              <span className={styles.folderCount}>{countOf(c)}</span>
              <span className={styles.folderLatest}>
                {latest ? (
                  <>
                    <span className={styles.folderLatestTitle}>{latest.title}</span>
                    <span className={styles.folderLatestDate}>{latest.date}</span>
                  </>
                ) : (
                  <span className={styles.folderEmpty}>등록된 글 없음</span>
                )}
              </span>
              <span className={styles.folderChevron} aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---------- 게시판 안 ---------- */
  return (
    <>
      <div className={styles.crumb}>
        <button type="button" className={styles.back} onClick={() => setOpenBoard(null)}>
          ‹ 게시판 목록
        </button>
        <span className={styles.crumbBoard}>{openBoard === "all" ? "전체글" : openBoard}</span>
      </div>

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
          onClick={() => {
            if (openBoard !== "all") setForm((f) => ({ ...f, category: openBoard }));
            setOpen((o) => !o);
          }}
        >
          {open ? "닫기" : "＋ 글 작성"}
        </button>
      </div>

      {open && (
        <form className={formStyles.createForm} onSubmit={create}>
          <div className={formStyles.formRow}>
            <label className={cn(formStyles.field, formStyles.narrow)}>
              <span className={formStyles.label}>카테고리</span>
              <select
                className={formStyles.input}
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
            <label className={formStyles.field}>
              <span className={formStyles.label}>제목</span>
              <input
                className={formStyles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 9월 정기 회의록"
                required
              />
            </label>
          </div>
          <label className={formStyles.field}>
            <span className={formStyles.label}>내용</span>
            <textarea
              className={formStyles.input}
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="회의 내용이나 자료 설명을 적어주세요."
            />
          </label>
          <div className={formStyles.formActions}>
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
            <td className={formStyles.rowActions}>
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
