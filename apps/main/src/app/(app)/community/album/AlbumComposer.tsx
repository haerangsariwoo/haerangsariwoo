"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { storagePath } from "@/lib/storage-name";
import {
  ALBUM_PRESET,
  compressImage,
  FileTooLargeError,
  THUMB_PRESET,
} from "@/lib/image-compress";
import {
  ALBUM_RATIOS,
  albumRatioCss,
  DEFAULT_ALBUM_RATIO,
  ratioLabel,
  type AlbumRatio,
} from "@/lib/album-ratio";
import { ALBUM_BUCKET } from "@/lib/community";
import { defaultPhotoFocus, type PhotoFocus } from "@/lib/photo-focus";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { FocusEditor } from "./FocusEditor";
import styles from "./composer.module.css";

/**
 * 화면에 놓인 사진 한 장.
 *
 * 이미 올라가 있는 사진(kept)과 방금 고른 사진(new)을 한 줄에 섞어 다뤄야
 * 순서를 자유롭게 바꿀 수 있다. 저장할 때만 둘을 갈라 처리한다.
 */
type Slot =
  | {
      kind: "kept";
      key: string;
      rowId: string;
      path: string;
      thumbPath: string | null;
      url: string;
      focus: PhotoFocus;
    }
  | { kind: "new"; key: string; file: File; url: string; focus: PhotoFocus };

/** 고치려고 불러온 게시글 */
export interface ComposerAlbum {
  id: string;
  title: string;
  body: string;
  ratio: AlbumRatio;
  photos: { rowId: string; path: string; thumbPath: string | null; url: string; focus: PhotoFocus }[];
}

function todayLabel() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 앨범 게시글 쓰기·고치기.
 *
 * 예전에는 관리자 화면까지 들어가야 사진을 올릴 수 있었다. 활동을 마치고
 * 폰으로 바로 올리는 자리가 필요해 커뮤니티 안으로 옮겼다.
 *
 * 새로 쓸 때는, 올리기를 누르기 전까지 아무것도 저장하지 않는다 — 쓰다 만
 * 게시글이 부원들 화면에 먼저 뜨는 일이 없어야 한다.
 */
export function AlbumComposer({ album }: { album?: ComposerAlbum }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInput = useRef<HTMLInputElement>(null);
  const isEdit = album !== undefined;

  const [title, setTitle] = useState(album?.title ?? "");
  const [body, setBody] = useState(album?.body ?? "");
  const [ratio, setRatio] = useState<AlbumRatio>(album?.ratio ?? DEFAULT_ALBUM_RATIO);
  const [photos, setPhotos] = useState<Slot[]>(
    album?.photos.map((p) => ({ kind: "kept" as const, key: p.rowId, ...p })) ?? [],
  );

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setPhotos((prev) => [
      ...prev,
      ...Array.from(files).map((file) => ({
        kind: "new" as const,
        key: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        focus: defaultPhotoFocus,
      })),
    ]);
  }

  function removePhoto(key: string) {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.key === key);
      // 아직 안 올린 사진만 임시 주소를 되돌린다. 올라간 사진은 진짜 주소다
      if (gone?.kind === "new") URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.key !== key);
    });
  }

  function setFocus(key: string, focus: PhotoFocus) {
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, focus } : p)));
  }

  function move(index: number, step: number) {
    const next = index + step;
    setPhotos((prev) => {
      if (next < 0 || next >= prev.length) return prev;
      const out = [...prev];
      [out[index], out[next]] = [out[next], out[index]];
      return out;
    });
  }

  /** 방금 고른 사진을 줄여 올리고, 저장할 행 모양으로 돌려준다 */
  async function uploadNew(userId: string, uploaded: string[]) {
    const paths = new Map<string, { path: string; thumb_path: string }>();
    const fresh = photos.filter((p) => p.kind === "new");

    for (let i = 0; i < fresh.length; i++) {
      setBusy(`사진 올리는 중 ${i + 1}/${fresh.length}`);
      const p = fresh[i] as Extract<Slot, { kind: "new" }>;

      // 원본(내려받기용)과 썸네일(목록용)을 함께 만든다
      const full = await compressImage(p.file, ALBUM_PRESET);
      const thumb = await compressImage(p.file, THUMB_PRESET);

      const path = storagePath(userId, full.name);
      const thumbPath = storagePath(userId, `thumb-${thumb.name}`);

      const [{ error: fullError }, { error: thumbError }] = await Promise.all([
        supabase.storage.from(ALBUM_BUCKET).upload(path, full),
        supabase.storage.from(ALBUM_BUCKET).upload(thumbPath, thumb),
      ]);
      if (fullError || thumbError) throw new Error("upload failed");

      uploaded.push(path, thumbPath);
      paths.set(p.key, { path, thumb_path: thumbPath });
    }
    return paths;
  }

  async function save() {
    if (busy) return;
    if (!title.trim()) {
      setError("제목을 적어주세요.");
      return;
    }
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다. 다시 로그인해 주세요.");
      return;
    }

    // 실패하면 도로 지워야 하므로 이번에 올린 경로를 들고 간다
    const uploaded: string[] = [];
    const fields = { title: title.trim(), body: body.trim() || null, ratio };
    // 뺀 사진의 파일이 안 지워졌는가
    let leftovers = false;

    try {
      const fresh = await uploadNew(user.id, uploaded);
      setBusy("저장하는 중…");

      if (album) {
        const { error: updateError } = await supabase
          .from("albums")
          .update(fields)
          .eq("id", album.id);
        if (updateError) throw new Error("album update failed");

        // 뺀 사진은 행과 파일을 함께 지운다
        const keptIds = new Set(
          photos.filter((p) => p.kind === "kept").map((p) => (p as { rowId: string }).rowId),
        );
        const dropped = album.photos.filter((p) => !keptIds.has(p.rowId));
        if (dropped.length > 0) {
          const { error: dropError } = await supabase
            .from("album_photos")
            .delete()
            .in("id", dropped.map((p) => p.rowId));
          if (dropError) throw new Error("photo delete failed");

          // 파일 지우기가 막혀도 저장은 끝낸다. 대신 남았다는 것을 알린다
          const files = dropped.flatMap(
            (p) => [p.path, p.thumbPath].filter(Boolean) as string[],
          );
          const { data: gone, error: removeError } = await supabase.storage
            .from(ALBUM_BUCKET)
            .remove(files);
          if (removeError || (gone?.length ?? 0) !== files.length) leftovers = true;
        }

        // 남긴 사진은 순서와 보이는 자리가 바뀌었을 수 있다
        for (let i = 0; i < photos.length; i++) {
          const p = photos[i];
          if (p.kind !== "kept") continue;
          const { error: orderError } = await supabase
            .from("album_photos")
            .update({ sort_order: i, focus: p.focus })
            .eq("id", p.rowId);
          if (orderError) throw new Error("photo order failed");
        }

        const added = photos
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => p.kind === "new")
          .map(({ p, i }) => ({ ...fresh.get(p.key)!, sort_order: i, focus: p.focus, album_id: album.id }));
        if (added.length > 0) {
          const { error: photoError } = await supabase.from("album_photos").insert(added);
          if (photoError) throw new Error("photo insert failed");
        }

        if (leftovers) {
          setBusy(null);
          setError("저장했지만 뺀 사진의 파일이 남았어요. 운영진에게 알려주세요.");
          return;
        }

        router.replace(`/community/album/${album.id}`);
        router.refresh();
        return;
      }

      // 새 글은 지금 제일 큰 값보다 하나 크게 — 목록 맨 위에 놓인다
      const { data: top } = await supabase
        .from("albums")
        .select("sort_order")
        .order("sort_order", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = ((top as { sort_order: number | null } | null)?.sort_order ?? 0) + 1;

      const { data, error: insertError } = await supabase
        .from("albums")
        .insert({ ...fields, sort_order: nextOrder, date_label: todayLabel() })
        .select("id")
        .single();
      if (insertError || !data) throw new Error("album insert failed");

      const albumId = (data as { id: string }).id;
      const rows = photos.map((p, i) => ({
        ...fresh.get(p.key)!,
        sort_order: i,
        focus: p.focus,
        album_id: albumId,
      }));

      if (rows.length > 0) {
        const { error: photoError } = await supabase.from("album_photos").insert(rows);
        if (photoError) {
          // 사진 없는 껍데기 게시글을 남기지 않는다
          await supabase.from("albums").delete().eq("id", albumId);
          throw new Error("photo insert failed");
        }
      }

      router.replace(`/community/album/${albumId}`);
      router.refresh();
      return;
    } catch (e) {
      if (uploaded.length > 0) await supabase.storage.from(ALBUM_BUCKET).remove(uploaded);
      setBusy(null);
      setError(
        e instanceof FileTooLargeError
          ? e.message
          : "저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
  }

  const frame = albumRatioCss(ratio);
  const editingPhoto = photos.find((p) => p.key === editing);

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community", label: "커뮤니티" }} />
      <h1 className={styles.heading}>{isEdit ? "게시글 수정" : "게시글 작성"}</h1>

      <label className={styles.field}>
        <span className={styles.label}>제목</span>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 9월 유기견 보호소 봉사"
          maxLength={60}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>
          사진
          {photos.length > 0 && <span className={styles.count}>{photos.length}장</span>}
        </span>

        <div className={styles.picked}>
          {photos.map((p, i) => (
            <div key={p.key} className={styles.thumb} style={{ aspectRatio: frame }}>
              {/* 아직 안 올린 사진이라 next/image 최적화를 태울 수 없다 */}
              <Image
                className={styles.thumbImage}
                src={p.url}
                alt=""
                fill
                sizes="120px"
                unoptimized
                style={{
                  objectPosition: `${p.focus.x}% ${p.focus.y}%`,
                  transform: `scale(${p.focus.zoom})`,
                  transformOrigin: `${p.focus.x}% ${p.focus.y}%`,
                }}
              />
              <button
                type="button"
                className={styles.thumbRemove}
                onClick={() => removePhoto(p.key)}
                aria-label={`${i + 1}번째 사진 빼기`}
              >
                ×
              </button>
              <button
                type="button"
                className={styles.thumbFocus}
                onClick={() => setEditing(p.key)}
              >
                위치 조정
              </button>
              {photos.length > 1 && (
                <div className={styles.thumbMove}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="앞으로">
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === photos.length - 1}
                    aria-label="뒤로"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          ))}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              // 같은 사진을 다시 고를 수 있게 비운다
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className={styles.addTile}
            style={{ aspectRatio: frame }}
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
          >
            ＋ 사진
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>사진 비율</span>
        {/* 사진마다 크기가 달라 틀을 정해두지 않으면 넘길 때 화면이 들썩인다 */}
        <div className={styles.ratioRow}>
          {ALBUM_RATIOS.map((r) => (
            <button
              key={r.value}
              type="button"
              className={cn(styles.ratioBtn, ratio === r.value && styles.ratioOn)}
              onClick={() => setRatio(r.value)}
              aria-pressed={ratio === r.value}
            >
              {r.label}
              <span className={styles.ratioValue}>{r.value}</span>
            </button>
          ))}
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>글</span>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="그날 무엇을 했는지 적어주세요. 비워두면 사진만 올라갑니다."
          rows={6}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      {editingPhoto && (
        <FocusEditor
          src={editingPhoto.url}
          frame={frame}
          frameLabel={ratioLabel(ratio)}
          focus={editingPhoto.focus}
          onChange={(focus) => setFocus(editingPhoto.key, focus)}
          onClose={() => setEditing(null)}
        />
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.publish}
          onClick={save}
          disabled={busy !== null || !title.trim()}
        >
          {busy ?? (isEdit ? "저장" : "올리기")}
        </button>
      </div>
    </div>
  );
}
