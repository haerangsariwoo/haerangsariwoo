import { applicationFields, motivationField, type FormField } from "@/lib/recruit-config";

/**
 * 지원서의 추가 문항 답을 사람이 읽을 수 있게 편다.
 *
 * applicants 표에는 이름·트랙·연락처·지원 동기만 자기 칸이 있고, 운영진이
 * 따로 만든 문항(성별 등)은 extra 에 {문항이름: 답} 으로 들어간다. 문항
 * 이름은 gender 처럼 영어라 그대로 보여줄 수 없다.
 */

/** 표에서 성별만 따로 뽑아 쓸 때 */
export const GENDER_KEY = "gender";

/**
 * 문항 이름을 사람이 읽는 이름으로.
 *
 * 기본 문항에서 찾고, 없으면 이름을 그대로 쓴다 — 운영진이 문항을 새로
 * 만들면 그 이름이 곧 라벨이라 크게 어긋나지 않는다.
 */
export function labelOf(name: string, fields: FormField[] = [...applicationFields, motivationField]) {
  return fields.find((f) => f.name === name)?.label ?? name;
}

export interface ExtraAnswer {
  name: string;
  label: string;
  value: string;
}

/** 화면에 늘어놓을 수 있는 형태로. 빈 답은 뺀다 */
export function extraAnswers(extra: Record<string, string> | null | undefined): ExtraAnswer[] {
  if (!extra) return [];
  return Object.entries(extra)
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([name, value]) => ({ name, label: labelOf(name), value: value.trim() }));
}
