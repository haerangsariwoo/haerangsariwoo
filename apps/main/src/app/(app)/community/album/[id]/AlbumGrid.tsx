"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { albumPreviewTiles, type Album } from "@/lib/community";
import { displayFileName } from "@/lib/storage-name";
import { makeZip, uniqueNames } from "@/lib/zip";
import styles from "./album.module.css";

/**
 * 폰에서 사진을 "사진 앱" 에 넣는 길은 공유창뿐이다. 그냥 내려받으면
 * 아이폰은 파일 앱에, 안드로이드는 다운로드 폴더에 들어간다. ZIP 이면
 * 갤러리에는 아예 안 뜬다. 그래서 공유창을 쓸 수 있으면 그쪽을 쓰고,
 * 공유창이 없는 PC 에서만 ZIP 으로 내려준다.
 */
function canShareFiles(files: File[]) {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files })
  );
}

/** 사용자가 공유창을 그냥 닫은 것 — 실패로 볼 일이 아니다 */
function isCancel(e: unknown) {
  return e instanceof DOMException && e.name === "AbortError";
}

function photoName(path: string | undefined, index: number) {
  return path ? displayFileName(path) : `사진 ${index + 1}.jpg`;
}

async function toFile(url: string, name: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("photo fetch failed");
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

async function saveZip(files: File[], albumTitle: string) {
  const entries = await Promise.all(
    files.map(async (f) => ({ name: f.name, data: new Uint8Array(await f.arrayBuffer()) })),
  );

  const url = URL.createObjectURL(makeZip(entries));
  const a = document.createElement("a");
  a.href = url;
  // 파일 이름에 못 쓰는 글자를 덜어낸다
  a.download = `${albumTitle.replace(/[\\/:*?"<>|]/g, "").trim() || "앨범"} 사진.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 저장이 시작될 틈을 준 뒤 정리한다
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

type SaveState =
  | { phase: "idle" }
  | { phase: "loading"; done: number; total: number }
  | { phase: "ready"; files: File[] };

/**
 * 앨범 격자와 사진 크게 보기.
 *
 * 격자에는 작은 그림만 깐다 — 칸이 220px 인데 2560px 원본을 깔면 20장짜리
 * 앨범 한 번 여는 데 17MB 가 나가고 부원들 데이터 요금도 그만큼 나간다.
 * 원본은 눌러서 크게 볼 때 그 한 장만 받는다.
 */
export function AlbumGrid({ album }: { album: Album }) {
  // 사진이 4장이 안 돼도 격자가 허전하지 않게 최소 4칸은 채운다
  const tiles = albumPreviewTiles(album, Math.max(album.photoCount, 4));
  const [openAt, setOpenAt] = useState<number | null>(null);
  const photo = openAt === null ? null : album.photos[openAt];
  const count = album.photos.length;

  const [save, setSave] = useState<SaveState>({ phase: "idle" });
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * 앨범 전체 저장.
   *
   * 폰은 "누른 직후" 에만 공유창을 열어준다. 사진을 다 받고 나서 열려고 하면
   * 시간이 지났다며 막는다. 그래서 받기와 저장을 두 번의 누름으로 나눴다 —
   * 첫 번째로 받아두고, 두 번째 누름에서 곧바로 공유창을 띄운다.
   */
  async function onSaveAll() {
    if (save.phase === "loading") return;
    setSaveError(null);

    if (save.phase === "ready") {
      try {
        await navigator.share({ files: save.files });
      } catch (e) {
        if (isCancel(e)) return;
        // 사진이 많으면 공유창이 거절하기도 한다 — 그때는 묶어서 내려준다
        await saveZip(save.files, album.title);
      }
      setSave({ phase: "idle" });
      return;
    }

    setSave({ phase: "loading", done: 0, total: count });
    try {
      const names = uniqueNames(album.photos.map((p, i) => photoName(p.path, i)));
      const files: File[] = [];
      // 한 장씩 차례로 받는다. 한꺼번에 받으면 폰에서 메모리가 튀고
      // 몇 장까지 왔는지도 알려줄 수 없다.
      for (let i = 0; i < album.photos.length; i++) {
        files.push(await toFile(album.photos[i].fullUrl, names[i]));
        setSave({ phase: "loading", done: i + 1, total: count });
      }

      if (canShareFiles(files)) {
        setSave({ phase: "ready", files });
      } else {
        await saveZip(files, album.title);
        setSave({ phase: "idle" });
      }
    } catch {
      setSaveError("사진을 모두 받지 못했어요. 잠시 후 다시 시도해 주세요.");
      setSave({ phase: "idle" });
    }
  }

  const openUrl = photo?.fullUrl ?? null;
  const openName = photo ? photoName(photo.path, openAt ?? 0) : null;
  const [shareOne, setShareOne] = useState<{ url: string; file: File } | null>(null);

  /**
   * 크게 보기를 여는 순간 원본을 미리 받아둔다. 저장을 눌렀을 때 그 자리에서
   * 기다리면 폰이 공유창을 막기 때문이다. 화면에 이미 같은 사진을 띄우고
   * 있어서 대개 캐시에서 바로 온다.
   */
  useEffect(() => {
    // 이전 사진의 것이 남아 있어도 아래에서 주소를 맞춰 보고 쓰므로 지우지 않는다
    if (!openUrl || !openName) return;

    let alive = true;
    toFile(openUrl, openName)
      .then((file) => {
        if (alive && canShareFiles([file])) setShareOne({ url: openUrl, file });
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [openUrl, openName]);

  // 크게 보는 동안은 뒤 화면이 따라 움직이지 않게 하고, 키로도 넘긴다
  useEffect(() => {
    if (openAt === null) return;

    const step = (by: number) =>
      setOpenAt((at) => {
        if (at === null) return at;
        const next = at + by;
        return next < 0 || next >= count ? at : next;
      });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [openAt, count]);

  function move(step: number) {
    setOpenAt((at) => {
      if (at === null) return at;
      const next = at + step;
      return next < 0 || next >= count ? at : next;
    });
  }

  const saveAllLabel =
    save.phase === "loading"
      ? `받는 중 ${save.done}/${save.total}`
      : save.phase === "ready"
        ? "사진 앱에 저장"
        : `${count}장 모두 저장`;

  return (
    <>
      {count > 0 && (
        <div className={styles.toolbar}>
          <p className={styles.hint}>
            {save.phase === "ready"
              ? "한 번 더 누르면 사진 앱에 저장할 수 있어요."
              : "사진을 누르면 크게 볼 수 있어요."}
          </p>
          <button
            type="button"
            className={cn(styles.saveAll, save.phase === "ready" && styles.saveReady)}
            onClick={onSaveAll}
            disabled={save.phase === "loading"}
          >
            {saveAllLabel}
          </button>
        </div>
      )}
      {saveError && <p className={styles.saveError}>{saveError}</p>}

      <div className={styles.grid}>
        {tiles.map((tile, i) =>
          tile.photo ? (
            <button
              key={i}
              type="button"
              className={cn(styles.photo, styles.photoButton)}
              onClick={() => setOpenAt(i)}
              aria-label={`${i + 1}번째 사진 크게 보기`}
            >
              <Image
                className={styles.photoImage}
                src={tile.photo.url}
                alt=""
                fill
                sizes="(min-width: 480px) 220px, 45vw"
                unoptimized
                style={{
                  objectPosition: `${tile.photo.focus.x}% ${tile.photo.focus.y}%`,
                  transform: `scale(${tile.photo.focus.zoom})`,
                  transformOrigin: `${tile.photo.focus.x}% ${tile.photo.focus.y}%`,
                }}
              />
            </button>
          ) : (
            <span key={i} className={cn(styles.photo, styles[tile.tone])} />
          ),
        )}
      </div>

      {photo && (
        <div
          className={styles.viewer}
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
          onClick={() => setOpenAt(null)}
        >
          <div className={styles.viewerBar}>
            <span className={styles.viewerCount}>
              {(openAt ?? 0) + 1} / {count}
            </span>

            {shareOne && shareOne.url === photo.fullUrl ? (
              <button
                type="button"
                className={styles.viewerSave}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.share({ files: [shareOne.file] }).catch(() => {});
                }}
              >
                저장
              </button>
            ) : (
              <a
                className={styles.viewerSave}
                href={photo.downloadUrl}
                onClick={(e) => e.stopPropagation()}
              >
                저장
              </a>
            )}

            <button
              type="button"
              className={styles.viewerClose}
              onClick={() => setOpenAt(null)}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* 사진 자체를 눌렀을 때는 닫히지 않게 한다 — 확대해 보는 중일 수 있다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.viewerImage}
            src={photo.fullUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />

          {openAt !== null && openAt > 0 && (
            <button
              type="button"
              className={cn(styles.viewerNav, styles.prev)}
              onClick={(e) => {
                e.stopPropagation();
                move(-1);
              }}
              aria-label="이전 사진"
            >
              ‹
            </button>
          )}
          {openAt !== null && openAt < count - 1 && (
            <button
              type="button"
              className={cn(styles.viewerNav, styles.next)}
              onClick={(e) => {
                e.stopPropagation();
                move(1);
              }}
              aria-label="다음 사진"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
