"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { albumRatioCss } from "@/lib/album-ratio";
import { type Album } from "@/lib/community";
import styles from "./album.module.css";

/**
 * 게시글의 사진을 한 장씩 넘겨 본다.
 *
 * 넘기기는 가로 스크롤에 맡긴다 — 폰에서 손가락으로 미는 느낌이 앱과 같고,
 * 직접 만든 것보다 훨씬 부드럽다. 지금 몇 번째인지는 스크롤 위치에서 읽는다.
 */
export function AlbumGrid({ album }: { album: Album }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const count = album.photos.length;

  // 어느 사진을 보고 있는지 스크롤 위치로 알아낸다
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const width = track.clientWidth;
      if (width > 0) setAt(Math.round(track.scrollLeft / width));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  function go(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(count - 1, index));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }

  if (count === 0) {
    return <p className={styles.empty}>아직 사진이 없어요.</p>;
  }

  // 게시글마다 정한 틀 — 넘겨도 사진 자리가 들썩이지 않는다
  const frameRatio = albumRatioCss(album.ratio);

  return (
    <>
      <div className={styles.carousel}>
        <div className={styles.track} ref={trackRef}>
          {album.photos.map((photo, i) => (
            <div key={i} className={styles.frame} style={{ aspectRatio: frameRatio }}>
              <Image
                className={styles.frameImage}
                src={photo.fullUrl}
                alt=""
                fill
                sizes="(min-width: 480px) 480px, 100vw"
                priority={i === 0}
                unoptimized
                style={{
                  objectPosition: `${photo.focus.x}% ${photo.focus.y}%`,
                  transform: `scale(${photo.focus.zoom})`,
                  transformOrigin: `${photo.focus.x}% ${photo.focus.y}%`,
                }}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            {/* 몇 장 중 몇 번째인지 — 넘길 게 남았는지 알려준다 */}
            <span className={styles.counter} aria-hidden="true">
              {at + 1} / {count}
            </span>

            {at > 0 && (
              <button
                type="button"
                className={cn(styles.nav, styles.prev)}
                onClick={() => go(at - 1)}
                aria-label="이전 사진"
              >
                ‹
              </button>
            )}
            {at < count - 1 && (
              <button
                type="button"
                className={cn(styles.nav, styles.next)}
                onClick={() => go(at + 1)}
                aria-label="다음 사진"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>

      {count > 1 && (
        <div className={styles.dots} role="tablist" aria-label="사진 넘기기">
          {album.photos.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === at}
              aria-label={`${i + 1}번째 사진`}
              className={cn(styles.dot, i === at && styles.dotOn)}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </>
  );
}
