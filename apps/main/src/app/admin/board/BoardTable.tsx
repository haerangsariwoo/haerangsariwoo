"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { storagePath } from "@/lib/storage-name";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import { useSemester } from "../SemesterContext";
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

const BUCKET = "board-files";
const SELECT = "id, category, title, body, file_paths, created_at, author:members(name)";

interface PostRow {
  id: string;
  category: Category;
  title: string;
  body: string;
  file_paths: string[];
  created_at: string;
  author: { name: string } | null;
}

interface Post {
  id: string;
  category: Category;
  title: string;
  body: string;
  filePaths: string[];
  author: string;
  date: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function toPost(r: PostRow): Post {
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    body: r.body,
    filePaths: r.file_paths,
    author: `${r.author?.name ?? "운영진"} 운영진`,
    date: formatDate(r.created_at),
  };
}

/**
 * 카페처럼 게시판을 폴더로 늘어놓고, 눌러서 들어간 게시판의 글만 보여준다.
 * "전체글" 은 실제 게시판이 아니라 폴더 목록 맨 위에 있는 통합 보기다
 * (네이버 카페의 "전체글보기" 와 같은 자리).
 */
export function BoardTable() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBoard, setOpenBoard] = useState<"all" | Category | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0] as Category, body: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  /** 본문에 끼워 넣은 사진들 — 등록할 때 첨부파일과 함께 올라간다 */
  const [inlineImages, setInlineImages] = useState<{ token: string; file: File }[]>([]);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("board_posts")
        .select(SELECT)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) setError("게시글을 불러오지 못했습니다.");
      else setRows(((data ?? []) as unknown as PostRow[]).map(toPost));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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
  }

  /**
   * 고른 사진을 본문 커서 자리에 끼워 넣는다.
   * 실제 업로드는 등록할 때 한 번에 하고, 지금은 자리표시자만 남긴다 —
   * 쓰다 만 글의 사진이 스토리지에 쌓이지 않게.
   */
  function insertImages(chosen: FileList | null) {
    if (!chosen || chosen.length === 0) return;
    const added = Array.from(chosen).map((file) => ({
      token: `__img_${crypto.randomUUID()}__`,
      file,
    }));
    setInlineImages((prev) => [...prev, ...added]);

    const el = bodyRef.current;
    const markdown = added.map((a) => `![${a.file.name}](${a.token})`).join("\n");
    const at = el?.selectionStart ?? form.body.length;
    const before = form.body.slice(0, at);
    const after = form.body.slice(at);
    const glue = before && !before.endsWith("\n") ? "\n" : "";
    setForm((f) => ({ ...f, body: `${before}${glue}${markdown}\n${after}` }));
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("로그인이 필요합니다.");
      return;
    }

    const paths: string[] = [];
    for (const file of files) {
      const path = storagePath(user.id, file.name);
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) {
        setBusy(false);
        setError("첨부파일을 올리지 못했습니다.");
        return;
      }
      paths.push(path);
    }

    // 본문에 끼운 사진은 올린 뒤 자리표시자를 실제 경로로 바꾼다
    let body = form.body.trim();
    for (const img of inlineImages) {
      if (!body.includes(img.token)) continue;
      const path = storagePath(user.id, img.file.name);
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, img.file);
      if (uploadError) {
        setBusy(false);
        setError("본문 사진을 올리지 못했습니다.");
        return;
      }
      body = body.replaceAll(img.token, path);
      paths.push(path);
    }

    const { data, error: insertError } = await supabase
      .from("board_posts")
      .insert({
        category: form.category,
        title: form.title.trim(),
        body,
        author_id: user.id,
        file_paths: paths,
      })
      .select(SELECT)
      .single();

    setBusy(false);
    if (insertError || !data) {
      setError("글을 등록하지 못했습니다.");
      return;
    }

    setRows((prev) => [toPost(data as unknown as PostRow), ...prev]);
    setForm({ title: "", category: form.category, body: "" });
    setFiles([]);
    setInlineImages([]);
    setOpen(false);
  }

  async function remove(id: string) {
    if (!window.confirm("이 글을 삭제할까요? 첨부파일도 함께 지워집니다.")) return;
    const post = rows.find((p) => p.id === id);
    const prev = rows;
    setRows((cur) => cur.filter((p) => p.id !== id));

    if (post && post.filePaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(post.filePaths);
    }
    const { error: deleteError } = await supabase.from("board_posts").delete().eq("id", id);
    if (deleteError) {
      setRows(prev);
      setError("삭제하지 못했습니다.");
    }
  }

  if (loading) return <p className={tableStyles.muted}>불러오는 중...</p>;

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

      {error && <p className={tableStyles.muted}>{error}</p>}

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
          disabled={readOnly && !open}
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
          <div className={formStyles.field}>
            <span className={formStyles.label}>내용</span>
            <textarea
              ref={bodyRef}
              className={formStyles.input}
              rows={8}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="회의 내용이나 자료 설명을 적어주세요. 빈 줄로 문단을 나눕니다."
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                insertImages(e.target.files);
                e.target.value = "";
              }}
            />
            <span className={styles.bodyTools}>
              <button
                type="button"
                className={toolbar.button}
                onClick={() => imageInputRef.current?.click()}
              >
                ＋ 본문에 사진 넣기
              </button>
              <span className={tableStyles.muted}>
                커서가 있는 자리에 들어갑니다. 등록하면 글 안에 사진으로 보여요.
              </span>
            </span>
          </div>
          <label className={formStyles.field}>
            <span className={formStyles.label}>첨부파일</span>
            <input
              className={formStyles.input}
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            {files.length > 0 && (
              <span className={tableStyles.muted}>{files.map((f) => f.name).join(", ")}</span>
            )}
          </label>
          <div className={formStyles.formActions}>
            <button
              type="submit"
              className={cn(toolbar.button, toolbar.primary)}
              disabled={!form.title.trim() || busy}
            >
              {busy ? "등록 중…" : "등록"}
            </button>
            <button type="button" className={toolbar.button} onClick={() => setOpen(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={["카테고리", "제목", "작성자", "작성일", "첨부", ""]}
        isEmpty={visible.length === 0}
        empty="조건에 맞는 글이 없습니다."
      >
        {visible.map((p) => (
          <tr key={p.id}>
            <td>
              <Badge tone={CAT_TONE[p.category]}>{p.category}</Badge>
            </td>
            <td>
              <Link href={`/admin/board/${p.id}`} className={styles.titleLink}>
                {p.title}
              </Link>
            </td>
            <td className={tableStyles.muted}>{p.author}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.date}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>
              {p.filePaths.length > 0 ? `${p.filePaths.length}개` : "—"}
            </td>
            <td className={formStyles.rowActions}>
              <RowAction onClick={() => remove(p.id)} disabled={readOnly}>
                삭제
              </RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
