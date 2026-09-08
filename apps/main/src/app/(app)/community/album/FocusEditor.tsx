"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { panFocus, type PhotoFocus } from "@/lib/photo-focus";
import styles from "./composer.module.css";

/**
 * 사진의 어느 부분을 보여줄지 정한다.
 *
 * 끌어서 위치를, 슬라이더로 확대를 정한다. 틀은 게시글에 정해둔 비율을
 * 그대로 받는다 — 여기서 맞춘 자리와 실제로 올라가는 자리가 달라지면
 * 맞출수록 어긋난다.
 *
 * 관리자 화면에도 같은 편집기가 있다. 거기는 관리자 색을 쓰고 여기는
 * 부원 화면 색을 써서, 껍데기만 따로 두고 계산은 panFocus 로 함께 쓴다.
 */
export function FocusEditor({
  src,
  frame,
  frameLabel,
  focus,
  onChange,
  onClose,
}: {
  src: string;
  /** CSS aspect-ratio 값 */
  frame: string;
  frameLabel: string;
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
    onChange(panFocus(focus, dx, dy, rect.width, rect.height));
  }

  function onPointerUp() {
    dragFrom.current = null;
  }

  return (
    <Dialog.Root open onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.sheet} aria-describedby={undefined}>
          <Dialog.Title className={styles.sheetTitle}>보이는 부분 정하기</Dialog.Title>
          <p className={styles.sheetHint}>
            사진을 끌어 옮기고, 슬라이더로 확대해 보이는 부분을 정합니다. 지금 틀은 {frameLabel}입니다.
          </p>

          <div
            ref={stageRef}
            className={styles.stage}
            style={{ aspectRatio: frame }}
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

          <div className={styles.sheetActions}>
            <button
              type="button"
              className={styles.sheetReset}
              onClick={() => onChange({ x: 50, y: 50, zoom: 1 })}
            >
              초기화
            </button>
            <Dialog.Close className={styles.sheetDone}>완료</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
