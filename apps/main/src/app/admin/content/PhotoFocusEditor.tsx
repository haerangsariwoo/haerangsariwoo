"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { PhotoFocus } from "@/lib/photo-focus";
import styles from "./PhotoFocusEditor.module.css";

function clamp(n: number) {
  return Math.min(100, Math.max(0, n));
}

/**
 * 정사각형 앨범 사진 박스에서 어느 부분이 잘릴지 정하는 편집기.
 * 드래그로 위치를, 슬라이더로 확대를 정한다. 모집 앱 관리자의 같은
 * 이름 컴포넌트와 동일한 방식 — object-position 은 zoom 1배에서
 * 잘리는 위치를, transform: scale 은 그 지점을 기준으로 한 추가
 * 확대를 맡는다.
 */
export function PhotoFocusEditor({
  src,
  alt,
  focus,
  onChange,
  onClose,
}: {
  src: string;
  alt: string;
  focus: PhotoFocus;
  onChange: (focus: PhotoFocus) => void;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragFrom = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragFrom.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragFrom.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = e.clientX - dragFrom.current.x;
    const dy = e.clientY - dragFrom.current.y;
    dragFrom.current = { x: e.clientX, y: e.clientY };
    onChange({
      ...focus,
      x: clamp(focus.x - (dx / rect.width) * 100),
      y: clamp(focus.y - (dy / rect.height) * 100),
    });
  }

  function onPointerUp() {
    dragFrom.current = null;
  }

  return (
    <Dialog.Root open onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <Dialog.Title className={styles.title}>사진 위치 조정</Dialog.Title>
          <p className={styles.hint}>사진을 드래그해 옮기고, 슬라이더로 확대해 보이는 부분을 정합니다.</p>

          <div
            ref={stageRef}
            className={styles.stage}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <Image
              className={styles.stageImage}
              src={src}
              alt={alt}
              fill
              sizes="440px"
              unoptimized
              draggable={false}
              style={{
                objectPosition: `${focus.x}% ${focus.y}%`,
                transform: `scale(${focus.zoom})`,
                transformOrigin: `${focus.x}% ${focus.y}%`,
              }}
            />
          </div>

          <div className={styles.zoomRow}>
            <span className={styles.zoomLabel}>확대</span>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={focus.zoom}
              onChange={(e) => onChange({ ...focus, zoom: Number(e.target.value) })}
              className={styles.zoomSlider}
              aria-label="사진 확대 배율"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={cn(styles.editorBtn, styles.resetBtn)}
              onClick={() => onChange({ x: 50, y: 50, zoom: 1 })}
            >
              초기화
            </button>
            <Dialog.Close className={cn(styles.editorBtn, styles.doneBtn)}>완료</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
