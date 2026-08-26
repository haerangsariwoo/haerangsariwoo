"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { storagePath } from "@/lib/storage-name";
import { compressImage, FileTooLargeError, SCREEN_PRESET } from "@/lib/image-compress";
import {
  imageMarkdown,
  imagePathsIn,
  imageWidthOf,
  removeImage,
  resizeImage,
} from "@/lib/board-body";
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
/** 사진을 처음 넣을 때 너비(글 폭 대비 %) */
const DEFAULT_WIDTH = 100;
const WIDTH_CHOICES = [
  { value: 40, label: "작게" },
  { value: 70, label: "보통" },
  { value: 100, label: "크게" },
];

interface InlineImage {
  token: string;
  file: File;
  previewUrl: string;
}

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
  const { readOnly, matches } = useSemester();
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
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  /** 수정 중인 글 id. null 이면 새 글이다 */
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const inBoard = openBoard !== null;
  const inTerm = rows.filter((p) => matches(p.date));
  const countOf = (c: Category) => inTerm.filter((p) => p.category === c).length;
  const latestOf = (c: Category) => inTerm.find((p) => p.category === c) ?? null;

  const bySearch = inTerm.filter(
    (p) => !q.trim() || p.title.includes(q.trim()) || p.author.includes(q.trim()),
  );
  const visible = bySearch.filter((p) => openBoard === "all" || p.category === openBoard);

  function enter(board: "all" | Category) {
    setOpenBoard(board);
    setQ("");
  }

  /** 작성 폼을 그대로 수정에도 쓴다. 이미 올라간 사진은 경로 그대로 남는다 */
  function startEdit(p: Post) {
    setEditingId(p.id);
    setForm({ title: p.title, category: p.category, body: p.body });
    setFiles([]);
    setInlineImages([]);
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setForm({ title: "", category: form.category, body: "" });
    setFiles([]);
    inlineImages.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setInlineImages([]);
  }

  /**
   * 사진을 본문 커서 자리에 끼워 넣는다. 고르기·붙여넣기·끌어놓기가 모두
   * 여기로 온다. 실제 업로드는 등록할 때 한 번에 하고 지금은 자리표시자만
   * 남긴다 — 쓰다 만 글의 사진이 스토리지에 쌓이지 않게.
   */
  function insertImages(chosen: File[] | FileList | null) {
    const list = Array.from(chosen ?? []).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    const added: InlineImage[] = list.map((file) => ({
      token: `__img_${crypto.randomUUID()}__`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setInlineImages((prev) => [...prev, ...added]);

    const el = bodyRef.current;
    const markdown = added
      .map((a) => imageMarkdown(a.file.name, DEFAULT_WIDTH, a.token))
      .join("\n");
    const at = el?.selectionStart ?? form.body.length;
    const before = form.body.slice(0, at);
    const after = form.body.slice(at);
    const glue = before && !before.endsWith("\n") ? "\n" : "";
    setForm((f) => ({ ...f, body: `${before}${glue}${markdown}\n${after}` }));
  }

  /** 캡처 화면이나 사진을 그대로 붙여넣을 수 있게 한다 */
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const images = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    // 사진을 붙여넣은 것이므로 파일 이름이 글자로 들어가지 않게 막는다
    e.preventDefault();
    insertImages(images);
  }

  function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const images = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    setDragOver(false);
    if (images.length === 0) return;
    e.preventDefault();
    insertImages(images);
  }

  function changeWidth(token: string, width: number) {
    setForm((f) => ({ ...f, body: resizeImage(f.body, token, width) }));
  }

  function dropImage(token: string) {
    setForm((f) => ({ ...f, body: removeImage(f.body, token) }));
    setInlineImages((prev) => {
      prev.filter((i) => i.token === token).forEach((i) => URL.revokeObjectURL(i.previewUrl));
      return prev.filter((i) => i.token !== token);
    });
  }

  /** 본문에 아직 남아 있는 사진만 — 지웠다 다시 쓴 경우도 맞춘다 */
  const usedTokens = new Set(imagePathsIn(form.body));
  const visibleInline = inlineImages.filter((i) => usedTokens.has(i.token));

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
    for (const original of files) {
      // 문서 첨부는 compressImage 가 그대로 돌려준다
      let file: File;
      try {
        file = await compressImage(original, SCREEN_PRESET);
      } catch (e) {
        setBusy(false);
        setError(e instanceof FileTooLargeError ? e.message : "첨부파일을 읽지 못했습니다.");
        return;
      }
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
    for (const img of visibleInline) {
      if (!body.includes(img.token)) continue;
      let small: File;
      try {
        small = await compressImage(img.file, SCREEN_PRESET);
      } catch (e) {
        setBusy(false);
        setError(e instanceof FileTooLargeError ? e.message : "본문 사진을 읽지 못했습니다.");
        return;
      }
      const path = storagePath(user.id, small.name);
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, small);
      if (uploadError) {
        setBusy(false);
        setError("본문 사진을 올리지 못했습니다.");
        return;
      }
      body = body.replaceAll(img.token, path);
      paths.push(path);
    }

    if (editingId) {
      const before = rows.find((p) => p.id === editingId);
      // 새로 올린 것 + 원래 있던 것 중 아직 본문에 남아 있는 것만 남긴다
      const kept = (before?.filePaths ?? []).filter(
        (path) => body.includes(path) || !imagePathsIn(before?.body ?? "").includes(path),
      );
      const dropped = (before?.filePaths ?? []).filter((path) => !kept.includes(path));

      const { data, error: updateError } = await supabase
        .from("board_posts")
        .update({
          category: form.category,
          title: form.title.trim(),
          body,
          file_paths: [...kept, ...paths],
        })
        .eq("id", editingId)
        .select(SELECT)
        .single();

      setBusy(false);
      if (updateError || !data) {
        setError("글을 수정하지 못했습니다.");
        return;
      }
      if (dropped.length > 0) await supabase.storage.from(BUCKET).remove(dropped);

      const updated = toPost(data as unknown as PostRow);
      setRows((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      closeForm();
      return;
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
    closeForm();
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
          <span className={styles.folderCount}>{inTerm.length}</span>
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
            if (open) {
              closeForm();
              return;
            }
            if (openBoard !== "all") setForm((f) => ({ ...f, category: openBoard }));
            setOpen(true);
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
              className={cn(formStyles.input, dragOver && styles.dropTarget)}
              rows={8}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes("Files")) return;
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              placeholder="회의 내용이나 자료 설명을 적어주세요. 사진은 그대로 붙여넣거나(Ctrl+V) 끌어다 놓아도 됩니다."
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
                붙여넣기(Ctrl+V)·끌어놓기도 됩니다. 커서가 있는 자리에 들어가요.
              </span>
            </span>

            {visibleInline.length > 0 && (
              <div className={styles.inlineList}>
                {visibleInline.map((img) => {
                  const width = imageWidthOf(form.body, img.token);
                  return (
                    <div key={img.token} className={styles.inlineItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className={styles.inlineThumb} src={img.previewUrl} alt="" />
                      <span className={styles.inlineName}>{img.file.name}</span>
                      <span className={styles.widthGroup} role="group" aria-label="사진 크기">
                        {WIDTH_CHOICES.map((w) => (
                          <button
                            key={w.value}
                            type="button"
                            aria-pressed={width === w.value}
                            className={cn(styles.widthBtn, width === w.value && styles.on)}
                            onClick={() => changeWidth(img.token, w.value)}
                          >
                            {w.label}
                          </button>
                        ))}
                      </span>
                      <button
                        type="button"
                        className={styles.inlineRemove}
                        onClick={() => dropImage(img.token)}
                        aria-label={`${img.file.name} 빼기`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
              {busy ? "저장 중…" : editingId ? "수정 저장" : "등록"}
            </button>
            <button type="button" className={toolbar.button} onClick={closeForm}>
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
              <RowAction onClick={() => startEdit(p)} disabled={readOnly}>
                수정
              </RowAction>
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
