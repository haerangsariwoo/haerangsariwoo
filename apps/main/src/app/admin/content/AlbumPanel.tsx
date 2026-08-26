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
  date_label: string;
  album_photos: {
    id: string;
    path: string;
    thumb_path: string | null;
    sort_order: number;
    focus: PhotoFocus | null;
  }[];
}

/** 화면에서 다루는 앨범 — 사진마다 DB 행 id 를 들고 있어야 지우고 고칠 수 있다 */
interface EditableAlbum extends Album {
  photos: (AlbumPhoto & { rowId: string; path: string; thumbPath: string | null })[];
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

  const publicUrl = useMemo(
    () => (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("albums")
        .select("id, title, date_label, album_photos(id, path, thumb_path, sort_order, focus)")
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
            return {
              id: a.id,
              title: a.title,
              date: a.date_label,
              photoCount: photos.length,
              tones: tonesFor(a.id),
              photos,
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
        date: row.date_label,
        photoCount: 0,
        tones: tonesFor(row.id),
        photos: [],
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

  /** 제목은 입력하는 동안 화면만 바꾸고, 포커스를 벗어날 때 저장한다 */
  function rename(id: string, title: string) {
    setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, title } : a)));
  }

  async function saveTitle(id: string) {
    const album = albums.find((a) => a.id === id);
    if (!album) return;
    const { error: updateError } = await supabase
      .from("albums")
      .update({ title: album.title })
      .eq("id", id);
    if (updateError) setError("앨범 이름을 저장하지 못했습니다.");
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

  const editingPhoto = editing && albums.find((a) => a.id === editing.albumId)?.photos[editing.index];

  return (
    <Panel
      title="활동 사진 (앨범)"
      count={`${albums.length}개`}
      desc="커뮤니티 앨범과 홈 화면에 노출되는 사진입니다. 올리면 바로 반영됩니다."
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
                  onChange={(e) => rename(a.id, e.target.value)}
                  onBlur={() => saveTitle(a.id)}
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

              <div className={styles.photoRow}>
                {a.photos.map((p, i) => (
                  <div key={p.rowId} className={styles.photoThumb}>
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

      {editing && editingPhoto && (
        <PhotoFocusEditor
          src={editingPhoto.url}
          alt=""
          focus={editingPhoto.focus}
          onChange={(focus) => updateFocus(editing.albumId, editing.index, focus)}
          onClose={() => setEditing(null)}
        />
      )}
    </Panel>
  );
}
