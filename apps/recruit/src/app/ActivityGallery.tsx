"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ActivityCard } from "@/lib/recruit-config";
import styles from "./ActivityGallery.module.css";

/**
 * 홈의 활동 사진 3장. 사진이 등록된 카드를 누르면 크게 볼 수 있다.
 * 사진이 아직 없는 카드는 확대할 것이 없어 버튼으로 만들지 않는다.
 */
export function ActivityGallery({ cards }: { cards: ActivityCard[] }) {
  const withPhoto = cards.filter((c) => c.photoUrl);
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = index !== null;
  const current = open ? withPhoto[index] : null;

  const close = useCallback(() => setIndex(null), []);

  const move = useCallback(
    (step: number) =>
      setIndex((i) => (i === null ? i : (i + step + withPhoto.length) % withPhoto.length)),
    [withPhoto.length],
  );

  // <dialog> 의 모달 모드를 쓰면 포커스 가둠과 Esc 닫기를 브라우저가 해준다
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // close 이벤트는 버블링되지 않아 React 의 onClose 로는 잡히지 않는다.
  // Esc 로 닫았을 때도 상태를 맞추려면 네이티브 리스너가 필요하다.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    el.addEventListener("close", close);
    return () => el.removeEventListener("close", close);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
      // Esc 는 브라우저도 <dialog> 를 닫지만, 그것만 믿으면
      // 리액트 상태가 열린 채로 남아 다음 클릭이 먹지 않는다
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    // 뒤 배경이 스크롤되지 않도록 잠근다.
    // 이 페이지에서 스크롤을 잠그는 곳은 여기뿐이라 해제는 빈 값으로 되돌린다.
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, move, close]);

  return (
    <>
      <div className={styles.grid}>
        {cards.map((a) => {
          const photoIndex = withPhoto.findIndex((p) => p.id === a.id);
          const body = (
            <>
              <span className={styles.photo}>
                {a.photoUrl ? (
                  <Image
                    className={styles.thumbImage}
                    src={a.photoUrl}
                    alt={a.title}
                    fill
                    sizes="120px"
                    unoptimized
                  />
                ) : (
                  <Image src="/icons/photo.svg" alt="" width={24} height={24} unoptimized />
                )}
              </span>
              <span className={styles.title}>{a.title}</span>
              <span className={styles.desc}>{a.desc}</span>
            </>
          );

          return a.photoUrl ? (
            <button
              key={a.id}
              type="button"
              className={cn(styles.card, styles.clickable)}
              onClick={() => setIndex(photoIndex)}
              aria-label={`${a.title} 사진 크게 보기`}
            >
              {body}
            </button>
          ) : (
            <article key={a.id} className={styles.card}>
              {body}
            </article>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClick={(e) => {
          // 배경(dialog 자체)을 누르면 닫는다
          if (e.target === dialogRef.current) close();
        }}
        aria-label="활동 사진 크게 보기"
      >
        {current && (
          <div className={styles.viewer}>
            <div className={styles.bar}>
              <span className={styles.counter}>
                {index! + 1} / {withPhoto.length}
              </span>
              <button type="button" className={styles.close} onClick={close} aria-label="닫기">
                ✕
              </button>
            </div>

            <div className={styles.stage}>
              <Image
                key={current.id}
                className={styles.fullImage}
                src={current.photoUrl!}
                alt={current.title}
                fill
                sizes="100vw"
                unoptimized
              />

              {withPhoto.length > 1 && (
                <>
                  <button
                    type="button"
                    className={cn(styles.nav, styles.prev)}
                    onClick={() => move(-1)}
                    aria-label="이전 사진"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={cn(styles.nav, styles.next)}
                    onClick={() => move(1)}
                    aria-label="다음 사진"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className={styles.caption}>
              <p className={styles.captionTitle}>{current.title}</p>
              <p className={styles.captionDesc}>{current.desc}</p>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
