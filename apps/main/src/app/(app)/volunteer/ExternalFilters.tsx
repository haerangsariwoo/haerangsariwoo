"use client";

import { useMemo } from "react";
import type { ExternalVolunteer } from "@/lib/external/types";
import styles from "./volunteer.module.css";

export interface ExternalFilterValue {
  sido: string;
  gugun: string;
  category: string;
}

const ALL = "전체";

/** 목록에서 실제로 존재하는 값만 선택지로 만든다 */
export function useExternalOptions(items: ExternalVolunteer[], value: ExternalFilterValue) {
  return useMemo(() => {
    const sidos = [...new Set(items.map((v) => v.sido).filter(Boolean))].sort();

    // 시도를 고르면 그 안의 시군구만 보여준다
    const scoped = value.sido === ALL ? items : items.filter((v) => v.sido === value.sido);
    const guguns = [...new Set(scoped.map((v) => v.gugun).filter(Boolean))].sort();

    const categories = [...new Set(items.map((v) => v.category).filter(Boolean))].sort();

    return { sidos, guguns, categories };
  }, [items, value.sido]);
}

export function filterExternal(items: ExternalVolunteer[], v: ExternalFilterValue) {
  return items.filter((item) => {
    if (v.sido !== ALL && item.sido !== v.sido) return false;
    if (v.gugun !== ALL && item.gugun !== v.gugun) return false;
    if (v.category !== ALL && item.category !== v.category) return false;
    return true;
  });
}

export function ExternalFilters({
  items,
  value,
  onChange,
}: {
  items: ExternalVolunteer[];
  value: ExternalFilterValue;
  onChange: (v: ExternalFilterValue) => void;
}) {
  const { sidos, guguns, categories } = useExternalOptions(items, value);

  return (
    <div className={styles.filterRow}>
      <select
        className={styles.select}
        value={value.sido}
        aria-label="지역 (시도)"
        onChange={(e) => onChange({ ...value, sido: e.target.value, gugun: ALL })}
      >
        <option value={ALL}>지역 전체</option>
        {sidos.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={value.gugun}
        aria-label="지역 (시군구)"
        disabled={guguns.length === 0}
        onChange={(e) => onChange({ ...value, gugun: e.target.value })}
      >
        <option value={ALL}>시·군·구 전체</option>
        {guguns.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={value.category}
        aria-label="봉사 유형"
        onChange={(e) => onChange({ ...value, category: e.target.value })}
      >
        <option value={ALL}>유형 전체</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
