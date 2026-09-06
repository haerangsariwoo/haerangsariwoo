"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { storagePath } from "@/lib/storage-name";
import {
  ALBUM_PRESET,
  compressImage,
  FileTooLargeError,
  THUMB_PRESET,
} from "@/lib/image-compress";
import { tonesFor, type Album, type AlbumPhoto } from "@/lib/community";
import {
  ALBUM_RATIOS,
  albumRatioCss,
  DEFAULT_ALBUM_RATIO,
  ratioLabel,
  toAlbumRatio,
  type AlbumRatio,
} from "@/lib/album-ratio";
import { defaultPhotoFocus, type PhotoFocus } from "@/lib/photo-focus";
import { Panel } from "@/components/admin/Panel/Panel";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./content.module.css";
import { PhotoFocusEditor } from "./PhotoFocusEditor";

const BUCKET = "album-photos";

interface AlbumRow {
  id: string;
  title: string;
  body: string | null;
  ratio: string | null;
  date_label: string;
  album_photos: {
    id: string;
    path: string;
    thumb_path: string | null;
    sort_order: number;
    focus: PhotoFocus | null;
  }[];
}

/** 저장 버튼을 눌러야 반영되는 값들 */
interface AlbumDraft {
  title: string;
  body: string;
  ratio: AlbumRatio;
}

/** 화면에서 다루는 앨범 — 사진마다 DB 행 id 를 들고 있어야 지우고 고칠 수 있다 */
interface EditableAlbum extends Album {
  photos: (AlbumPhoto & { rowId: string; path: string; thumbPath: string | null })[];
  /** 마지막으로 저장된 값. 지금 값과 다르면 아직 안 올라간 수정이 있다는 뜻이다 */
  saved: AlbumDraft;
}

function isDirty(a: EditableAlbum) {
  return a.title !== a.saved.title || a.body !== a.saved.body || a.ratio !== a.saved.ratio;
}

function todayLabel() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 활동 사진(앨범). 운영진이 여기서 앨범을 만들고 사진을 올리면
 * 커뮤니티 탭과 홈 화면에 바로 반영된다 — 따로 저장 버튼이 없다.
 */
export function AlbumPanel() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [albums, setAlbums] = useState<EditableAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [editing, setEditing] = useState<{ albumId: string; index: number } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const publicUrl = useMemo(
    () => (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("albums")
        .select("*, album_photos(id, path, thumb_path, sort_order, focus)")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError("앨범을 불러오지 못했습니다. 추가 스키마(followup-schema.sql)를 실행했는지 확인해 주세요.");
      } else {
        setAlbums(
          ((data ?? []) as unknown as AlbumRow[]).map((a) => {
            const photos = [...a.album_photos]
              .sort((x, y) => x.sort_order - y.sort_order)
              .map((p) => ({
                rowId: p.id,
                path: p.path,
                thumbPath: p.thumb_path,
                // 관리자 화면 미리보기도 작은 것으로 — 원본을 깔 이유가 없다
                url: publicUrl(p.thumb_path ?? p.path),
                fullUrl: publicUrl(p.path),
                downloadUrl: `${publicUrl(p.path)}?download`,
                focus: p.focus ?? defaultPhotoFocus,
              }));
            const ratio = toAlbumRatio(a.ratio);
            return {
              id: a.id,
              title: a.title,
              body: a.body ?? "",
              ratio,
              date: a.date_label,
              photoCount: photos.length,
              tones: tonesFor(a.id),
              photos,
              saved: { title: a.title, body: a.body ?? "", ratio },
            };
          }),
        );
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, publicUrl]);

  async function createAlbum() {
    const title = window.prompt("앨범 이름을 적어주세요.", "새 앨범");
    if (!title?.trim()) return;
    const { data, error: insertError } = await supabase
      .from("albums")
      .insert({ title: title.trim(), date_label: todayLabel() })
      .select("id, title, date_label")
      .single();
    if (insertError || !data) {
      setError("앨범을 만들지 못했습니다.");
      return;
    }
    const row = data as { id: string; title: string; date_label: string };
    setAlbums((prev) => [
      {
        id: row.id,
        title: row.title,
        body: "",
        ratio: DEFAULT_ALBUM_RATIO,
        date: row.date_label,
        photoCount: 0,
        tones: tonesFor(row.id),
        photos: [],
        saved: { title: row.title, body: "", ratio: DEFAULT_ALBUM_RATIO },
      },
      ...prev,
    ]);
  }

  async function removeAlbum(id: string) {
    const album = albums.find((a) => a.id === id);
    if (!album) return;
    if (!window.confirm(`"${album.title}" 앨범을 삭제할까요? 사진도 함께 지워집니다.`)) return;

    const prev = albums;
    setAlbums((cur) => cur.filter((a) => a.id !== id));
    if (album.photos.length > 0) {
      await supabase.storage
        .from(BUCKET)
        .remove(album.photos.flatMap((p) => [p.path, p.thumbPath].filter(Boolean) as string[]));
    }
    const { error: deleteError } = await supabase.from("albums").delete().eq("id", id);
    if (deleteError) {
      setAlbums(prev);
      setError("앨범을 삭제하지 못했습니다.");
    }
  }

  /** 제목·글·비율은 화면에서만 바뀐다. 저장 버튼을 눌러야 실제로 올라간다 */
  function edit(id: string, patch: Partial<AlbumDraft>) {
    setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    setJustSaved(null);
  }

  async function saveAlbum(id: string) {
    const album = albums.find((a) => a.id === id);
    if (!album) return;

    setSaving(id);
    setError(null);
    const { error: updateError } = await supabase
      .from("albums")
      .update({ title: album.title, body: album.body, ratio: album.ratio })
      .eq("id", id);
    setSaving(null);

    if (updateError) {
      setError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    // 저장된 값을 기억해 둬야 "고친 것이 남았는지" 를 알 수 있다
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, saved: { title: a.title, body: a.body, ratio: a.ratio } } : a,
      ),
    );
    setJustSaved(id);
  }

  async function onFileChosen(albumId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
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

    const album = albums.find((a) => a.id === albumId);
    let order = album?.photos.length ?? 0;
    const added: EditableAlbum["photos"] = [];

    for (const original of Array.from(files)) {
      // 원본(내려받기용)과 썸네일(격자용)을 함께 만든다
      let full: File;
      let thumb: File;
      try {
        full = await compressImage(original, ALBUM_PRESET);
        thumb = await compressImage(original, THUMB_PRESET);
      } catch (e) {
        setBusy(false);
        setError(e instanceof FileTooLargeError ? e.message : "사진을 읽지 못했습니다.");
        return;
      }

      const path = storagePath(user.id, full.name);
      const thumbPath = storagePath(user.id, `thumb-${thumb.name}`);

      const [{ error: fullError }, { error: thumbError }] = await Promise.all([
        supabase.storage.from(BUCKET).upload(path, full),
        supabase.storage.from(BUCKET).upload(thumbPath, thumb),
      ]);
      if (fullError || thumbError) {
        await supabase.storage.from(BUCKET).remove([path, thumbPath]);
        setBusy(false);
        setError("사진을 올리지 못했습니다.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("album_photos")
        .insert({ album_id: albumId, path, thumb_path: thumbPath, sort_order: order })
        .select("id")
        .single();
      if (insertError || !data) {
        await supabase.storage.from(BUCKET).remove([path, thumbPath]);
        setBusy(false);
        setError("사진 정보를 저장하지 못했습니다.");
        return;
      }

      added.push({
        rowId: (data as { id: string }).id,
        path,
        thumbPath,
        url: publicUrl(thumbPath),
        fullUrl: publicUrl(path),
        downloadUrl: `${publicUrl(path)}?download`,
        focus: defaultPhotoFocus,
      });
      order += 1;
    }

    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? { ...a, photos: [...a.photos, ...added], photoCount: a.photos.length + added.length }
          : a,
      ),
    );
    setBusy(false);
  }

  async function removePhoto(albumId: string, index: number) {
    const album = albums.find((a) => a.id === albumId);
    const photo = album?.photos[index];
    if (!photo) return;

    const prev = albums;
    setAlbums((cur) =>
      cur.map((a) =>
        a.id === albumId
          ? {
              ...a,
              photos: a.photos.filter((_, i) => i !== index),
              photoCount: Math.max(0, a.photoCount - 1),
            }
          : a,
      ),
    );
    await supabase.storage.from(BUCKET).remove([photo.path, photo.thumbPath].filter(Boolean) as string[]);
    const { error: deleteError } = await supabase
      .from("album_photos")
      .delete()
      .eq("id", photo.rowId);
    if (deleteError) {
      setAlbums(prev);
      setError("사진을 삭제하지 못했습니다.");
    }
  }

  async function updateFocus(albumId: string, index: number, focus: PhotoFocus) {
    const photo = albums.find((a) => a.id === albumId)?.photos[index];
    if (!photo) return;
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? { ...a, photos: a.photos.map((p, i) => (i === index ? { ...p, focus } : p)) }
          : a,
      ),
    );
    await supabase.from("album_photos").update({ focus }).eq("id", photo.rowId);
  }

  const editingAlbum = editing ? albums.find((a) => a.id === editing.albumId) : undefined;
  const editingPhoto = editing && editingAlbum ? editingAlbum.photos[editing.index] : undefined;

  return (
    <Panel
      title="활동 사진 (앨범)"
      count={`${albums.length}개`}
      desc="커뮤니티 앨범과 홈 화면에 노출되는 게시글입니다. 사진은 올리는 즉시 반영되고, 제목·글·사진 비율은 저장을 눌러야 반영됩니다."
    >
      {error && <p className={styles.saveNote}>{error}</p>}

      <div className={toolbar.toolbar}>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={createAlbum}
          disabled={readOnly || busy}
        >
          ＋ 앨범 만들기
        </button>
      </div>

      {loading ? (
        <p className={styles.saveNote}>불러오는 중...</p>
      ) : albums.length === 0 ? (
        <p className={styles.saveNote}>아직 만든 앨범이 없습니다.</p>
      ) : (
        <div className={styles.itemList}>
          {albums.map((a) => (
            <div key={a.id} className={styles.albumBlock}>
              <div className={styles.albumHead}>
                <input
                  className={styles.albumTitle}
                  value={a.title}
                  onChange={(e) => edit(a.id, { title: e.target.value })}
                  aria-label={`${a.title} 앨범 이름`}
                  disabled={readOnly}
                />
                <p className={styles.albumMeta}>
                  {a.date}
                  <span className={styles.dot}>·</span>
                  사진 {a.photoCount}장
                </p>
                {!readOnly && (
                  <button
                    type="button"
                    className={toolbar.button}
                    onClick={() => removeAlbum(a.id)}
                  >
                    앨범 삭제
                  </button>
                )}
              </div>

              {/* 사진과 함께 올리는 글. 비워두면 사진만 있는 게시글이 된다 */}
              <textarea
                className={styles.albumBody}
                value={a.body}
                onChange={(e) => edit(a.id, { body: e.target.value })}
                placeholder="그날 무엇을 했는지 적어주세요. 비워두면 사진만 올라갑니다."
                rows={3}
                aria-label={`${a.title} 글`}
                disabled={readOnly}
              />

              <div className={styles.albumOptions}>
                {/* 사진마다 크기가 달라 틀을 정해두지 않으면 넘길 때 화면이 들썩인다 */}
                <label className={styles.ratioLabel}>
                  사진 비율
                  <select
                    className={styles.ratioSelect}
                    value={a.ratio}
                    onChange={(e) => edit(a.id, { ratio: toAlbumRatio(e.target.value) })}
                    disabled={readOnly}
                  >
                    {ALBUM_RATIOS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label} ({r.value})
                      </option>
                    ))}
                  </select>
                </label>

                <span className={toolbar.spacer} />

                {justSaved === a.id && !isDirty(a) && (
                  <span className={styles.savedMark}>저장했습니다</span>
                )}
                <button
                  type="button"
                  className={cn(toolbar.button, isDirty(a) && toolbar.primary)}
                  onClick={() => saveAlbum(a.id)}
                  disabled={readOnly || saving === a.id || !isDirty(a)}
                >
                  {saving === a.id ? "저장 중…" : "저장"}
                </button>
              </div>

              <div className={styles.photoRow}>
                {a.photos.map((p, i) => (
                  <div
                    key={p.rowId}
                    className={styles.photoThumb}
                    style={{ aspectRatio: albumRatioCss(a.ratio) }}
                  >
                    <Image
                      className={styles.photoThumbImage}
                      src={p.url}
                      alt=""
                      fill
                      sizes="88px"
                      unoptimized
                      style={{
                        objectPosition: `${p.focus.x}% ${p.focus.y}%`,
                        transform: `scale(${p.focus.zoom})`,
                        transformOrigin: `${p.focus.x}% ${p.focus.y}%`,
                      }}
                    />
                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          className={styles.photoRemove}
                          onClick={() => removePhoto(a.id, i)}
                          aria-label="사진 삭제"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          className={styles.photoAdjust}
                          onClick={() => setEditing({ albumId: a.id, index: i })}
                        >
                          위치 조정
                        </button>
                      </>
                    )}
                  </div>
                ))}

                <input
                  ref={(el) => {
                    fileInputs.current[a.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => onFileChosen(a.id, e.target.files)}
                />
                <button
                  type="button"
                  className={styles.addPhotoTile}
                  onClick={() => fileInputs.current[a.id]?.click()}
                  disabled={readOnly || busy}
                >
                  {busy ? "올리는 중…" : "＋ 사진 추가"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && editingAlbum && editingPhoto && (
        <PhotoFocusEditor
          src={editingPhoto.url}
          alt=""
          focus={editingPhoto.focus}
          frame={albumRatioCss(editingAlbum.ratio)}
          frameLabel={ratioLabel(editingAlbum.ratio)}
          onChange={(focus) => updateFocus(editing.albumId, editing.index, focus)}
          onClose={() => setEditing(null)}
        />
      )}
    </Panel>
  );
}
