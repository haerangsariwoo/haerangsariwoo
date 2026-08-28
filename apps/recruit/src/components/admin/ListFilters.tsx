"use client";

import { ui } from "./Panel";
import { type LengthRange, type NameSort } from "@/lib/list-filters";

/**
 * 지원자 관리와 심사가 함께 쓰는 정렬·필터 조각.
 * 두 화면이 같은 명단을 다른 목적으로 보는 것이라 조작이 어긋나면 헷갈린다.
 */

export function SortSelect({
  value,
  onChange,
  defaultLabel,
}: {
  value: NameSort;
  onChange: (v: NameSort) => void;
  /** 기본 정렬이 무엇인지 알려준다 — "기본" 만 있으면 뭐가 기준인지 모른다 */
  defaultLabel: string;
}) {
  return (
    <select
      className={ui.select}
      value={value}
      onChange={(e) => onChange(e.target.value as NameSort)}
      aria-label="정렬"
    >
      <option value="default">{defaultLabel}</option>
      <option value="name">이름 가나다순</option>
    </select>
  );
}

export function LengthFilter({
  value,
  onChange,
}: {
  value: LengthRange;
  onChange: (v: LengthRange) => void;
}) {
  return (
    <span className={ui.rangeGroup}>
      <span className={ui.rangeLabel}>지원 동기</span>
      <input
        className={ui.rangeInput}
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="최소"
        aria-label="지원 동기 최소 글자 수"
        value={value.min}
        onChange={(e) => onChange({ ...value, min: e.target.value })}
      />
      <span className={ui.rangeTilde}>~</span>
      <input
        className={ui.rangeInput}
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="최대"
        aria-label="지원 동기 최대 글자 수"
        value={value.max}
        onChange={(e) => onChange({ ...value, max: e.target.value })}
      />
      <span className={ui.rangeLabel}>자</span>
    </span>
  );
}
