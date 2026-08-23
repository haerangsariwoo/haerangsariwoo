"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import type { ActivityCard } from "@/lib/recruit-config";
import styles from "./ActivityGallery.module.css";

/**
 * 홈의 활동 사진. 사진이 등록된 카드를 누르면 크게 볼 수 있다.
 * 사진이 아직 없는 카드는 확대할 것이 없어 버튼으로 만들지 않는다.
 *
 * 모달은 Radix Dialog 를 쓴다. 포커스 가둠·배경 스크롤 잠금·Esc 닫기를
 * 직접 구현하면 상태가 어긋나기 쉬워 예전에 실제로 버그가 났었다.
 */
export function ActivityGallery({ cards }: { cards: ActivityCard[] }) {
  const withPhoto = cards.filter((c) => c.photoUrl);
  const [index, setIndex] = useState<number | null>(null);

  const open = index !== null;
  const current = open ? withPhoto[index] : null;

  const move = useCallback(
    (step: number) =>
      setIndex((i) => (i === null ? i : (i + step + withPhoto.length) % withPhoto.length)),
    [withPhoto.length],
  );

  // 좌우 방향키로 사진 넘기기 (Esc 는 Radix 가 처리한다)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, move]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && setIndex(null)}>
      <div className={styles.grid}>
        {cards.map((a) => {
          const photoIndex = withPhoto.findIndex((p) => p.id === a.id);
          const body = (
            <>
              <span className={styles.thumb}>
                {a.photoUrl ? (
                  <Image
                    className={styles.thumbImage}
                    src={a.photoUrl}
                    alt={a.title}
                    fill
                    sizes="(min-width: 1200px) 380px, (min-width: 768px) 50vw, 100vw"
                    unoptimized
                  />
                ) : (
                  <Image src="/icons/photo.svg" alt="" width={32} height={32} unoptimized />
                )}
                {a.photoUrl && (
                  <span className={styles.zoomHint} aria-hidden="true">
                    ⤢
                  </span>
                )}
              </span>
              <span className={styles.body}>
                <span className={styles.title}>{a.title}</span>
                <span className={styles.desc}>{a.desc}</span>
              </span>
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

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.viewer} aria-describedby={undefined}>
          {current && (
            <>
              <div className={styles.bar}>
                <span className={styles.counter}>
                  {index! + 1} / {withPhoto.length}
                </span>
                <Dialog.Close className={styles.close} aria-label="닫기">
                  ✕
                </Dialog.Close>
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
                <Dialog.Title className={styles.captionTitle}>{current.title}</Dialog.Title>
                <p className={styles.captionDesc}>{current.desc}</p>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
