"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { PhotoFocus } from "@/lib/photo-focus";
import styles from "./ProfilePhotoEditor.module.css";

function clamp(n: number) {
  return Math.min(100, Math.max(0, n));
}

/**
 * 프로필 사진(원형)에서 어느 부분이 보일지 정하는 편집기. 관리자
 * 페이지의 같은 이름 컴포넌트와 방식은 같지만, 회원 화면에서도 쓰이므로
 * admin 전용 토큰(--a-*) 대신 사이트 공통 토큰을 쓴다.
 */
export function ProfilePhotoEditor({
  src,
  focus,
  onChange,
  onClose,
}: {
  src: string;
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
          <Dialog.Title className={styles.title}>프로필 사진 위치 조정</Dialog.Title>
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
              alt=""
              fill
              sizes="280px"
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
