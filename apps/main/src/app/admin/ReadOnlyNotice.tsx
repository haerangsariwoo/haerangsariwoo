"use client";

import { SEMESTERS, useSemester } from "./SemesterContext";
import styles from "./layout.module.css";

/**
 * 지난 학기를 보는 중일 때만 뜬다. 화면마다 "왜 버튼이 눌리지 않지" 를
 * 알려주는 역할 — 아래 각 관리 화면은 이 문구를 따로 만들지 않고
 * readOnly 값만 보고 자기 버튼들을 잠근다.
 */
export function ReadOnlyNotice() {
  const { readOnly, semester } = useSemester();
  if (!readOnly) return null;

  const label = SEMESTERS.find((s) => s.value === semester)?.label ?? semester;

  return (
    <p className={styles.readOnlyNotice}>
      <b>{label}</b>는 지난 학기 기록이라 읽기 전용입니다. 새로 쓰거나 바꿀 수는 없고,
      복사·내보내기는 그대로 됩니다.
    </p>
  );
}
