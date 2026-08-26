"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { albumPreviewTiles, type Album } from "@/lib/community";
import { displayFileName } from "@/lib/storage-name";
import { makeZip, uniqueNames, type ZipEntry } from "@/lib/zip";
import styles from "./album.module.css";

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
  const [saving, setSaving] = useState<{ done: number; total: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * 앨범 사진을 한 번에 받는다. 한 장씩 차례로 받아 묶는데, 한꺼번에 받으면
   * 폰에서 메모리가 튀고 몇 장까지 왔는지도 알려줄 수 없다.
   */
  async function saveAll() {
    if (saving) return;
    setSaveError(null);
    setSaving({ done: 0, total: count });

    try {
      const names = uniqueNames(
        album.photos.map((p, i) => (p.path ? displayFileName(p.path) : `사진 ${i + 1}.jpg`)),
      );

      const entries: ZipEntry[] = [];
      for (let i = 0; i < album.photos.length; i++) {
        const res = await fetch(album.photos[i].fullUrl);
        if (!res.ok) throw new Error("photo fetch failed");
        entries.push({ name: names[i], data: new Uint8Array(await res.arrayBuffer()) });
        setSaving({ done: i + 1, total: count });
      }

      const url = URL.createObjectURL(makeZip(entries));
      const a = document.createElement("a");
      a.href = url;
      // 파일 이름에 못 쓰는 글자를 덜어낸다
      a.download = `${album.title.replace(/[\/:*?"<>|]/g, "") || "앨범"} 사진.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 저장이 시작될 틈을 준 뒤 정리한다
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setSaveError("사진을 모두 받지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(null);
    }
  }

  function move(step: number) {
    setOpenAt((at) => {
      if (at === null) return at;
      const next = at + step;
      return next < 0 || next >= count ? at : next;
    });
  }

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

  return (
    <>
      {count > 0 && (
        <div className={styles.toolbar}>
          <p className={styles.hint}>사진을 누르면 크게 볼 수 있어요.</p>
          <button type="button" className={styles.saveAll} onClick={saveAll} disabled={!!saving}>
            {saving ? `받는 중 ${saving.done}/${saving.total}` : `${count}장 모두 저장`}
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
            <a
              className={styles.viewerSave}
              href={photo.downloadUrl}
              onClick={(e) => e.stopPropagation()}
            >
              저장
            </a>
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
