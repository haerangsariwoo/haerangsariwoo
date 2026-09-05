"use client";

import { cn } from "@/lib/cn";
import { ui } from "./Panel";
import { extraAnswers } from "@/lib/extra-answers";
import styles from "./Motivation.module.css";

/**
 * 지원 동기를 표 안에서 읽는 자리.
 *
 * 지원자 관리·면접 일정·최종 심사 세 화면이 같은 명단을 다른 목적으로
 * 본다. 어느 화면에서든 같은 모양으로 펼쳐 읽을 수 있어야 하고, 세 번
 * 따로 만들면 언젠가 한 곳만 고쳐져 어긋난다.
 */

/** 표 칸 안의 미리보기 + 펼침 단추 */
export function MotivationCell({
  text,
  open,
  onToggle,
}: {
  text: string | null | undefined;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.cell}>
      {/* 단추가 밀려나지 않게 글자 쪽만 줄인다 */}
      <span className={cn(ui.muted, styles.preview)}>{text}</span>
      <button type="button" className={ui.rowBtn} onClick={onToggle}>
        {open ? "접기" : "보기"}
      </button>
    </div>
  );
}

/**
 * 펼쳐진 내용을 담는 줄.
 *
 * 표 칸 안에서 늘리면 열 너비가 무너지므로, 표 전체 폭을 쓰는 줄을 따로
 * 두고 거기서 읽게 한다. colSpan 은 화면마다 열 수가 달라 받아서 쓴다.
 */
export function MotivationRow({
  colSpan,
  text,
  meta,
  extra,
}: {
  colSpan: number;
  text: string | null | undefined;
  /** 누구의 지원서인지 — 펼쳐 읽다 보면 위 줄이 안 보인다 */
  meta: string;
  /** 운영진이 따로 만든 문항의 답 (성별 등) */
  extra?: Record<string, string> | null;
}) {
  const body = text ?? "";
  const answers = extraAnswers(extra);

  return (
    <tr className={styles.row}>
      <td colSpan={colSpan}>
        <div className={styles.detail}>
          <p className={styles.label}>
            지원 동기
            <span className={styles.count}>{body.length}자</span>
          </p>
          <p className={styles.body}>{body}</p>

          {/* 성별처럼 따로 만든 문항은 표에 칸이 없으니 여기서 보여준다 */}
          {answers.length > 0 && (
            <dl className={styles.answers}>
              {answers.map((a) => (
                <div key={a.name} className={styles.answer}>
                  <dt className={styles.answerLabel}>{a.label}</dt>
                  <dd className={styles.answerValue}>{a.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className={styles.meta}>{meta}</p>
        </div>
      </td>
    </tr>
  );
}
