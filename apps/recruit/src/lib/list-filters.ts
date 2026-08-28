/**
 * 명단 정렬·필터 계산.
 *
 * 화면 조각과 떼어 둔다 — 경계값이 많아 눈으로만 보고는 맞는지 확인할 수 없다.
 */

export type NameSort = "default" | "name";

/** 한글 이름은 localeCompare 에 "ko" 를 줘야 자모 순서가 맞는다 */
export function byName<T extends { name: string }>(a: T, b: T) {
  return a.name.localeCompare(b.name, "ko");
}

export function sortRows<T extends { name: string }>(rows: T[], sort: NameSort) {
  // 원본을 건드리지 않는다 — 부르는 쪽이 들고 있는 목록이 같이 바뀐다
  return sort === "name" ? [...rows].sort(byName) : rows;
}

export interface LengthRange {
  /** 빈 값이면 제한 없음 */
  min: string;
  max: string;
}

export const emptyLength: LengthRange = { min: "", max: "" };

/** 지원 동기 글자 수가 범위 안에 드는가 */
export function inLength(text: string | null | undefined, r: LengthRange) {
  const n = (text ?? "").length;

  const min = Number(r.min);
  if (r.min.trim() !== "" && Number.isFinite(min) && n < min) return false;

  const max = Number(r.max);
  if (r.max.trim() !== "" && Number.isFinite(max) && n > max) return false;

  return true;
}
