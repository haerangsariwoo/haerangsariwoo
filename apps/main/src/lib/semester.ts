/**
 * 학기 계산을 한 곳에 모은다.
 * 어느 표에도 학기 컬럼이 없어서 날짜로 가른다 — 3~8월이 1학기,
 * 9월~이듬해 2월이 2학기다. "지금 학기"도 오늘 날짜에서 뽑기 때문에
 * 학기가 바뀔 때 코드를 고칠 일이 없다.
 */

export interface SemesterOption {
  value: string;
  label: string;
}

/** "2026-1" 처럼 표기한다 */
export function semesterOf(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 8) return `${y}-1`;
  if (m >= 9) return `${y}-2`;
  // 1·2월은 지난해 2학기의 끝자락이다
  return `${y - 1}-2`;
}

export function semesterLabel(value: string) {
  const [y, n] = value.split("-");
  return `${y}-${n}학기`;
}

/** 그 학기가 걸쳐 있는 기간 [시작, 끝) */
export function semesterRange(value: string): { from: Date; to: Date } {
  const [yRaw, nRaw] = value.split("-");
  const y = Number(yRaw);
  return Number(nRaw) === 1
    ? { from: new Date(y, 2, 1), to: new Date(y, 8, 1) }
    : { from: new Date(y, 8, 1), to: new Date(y + 1, 2, 1) };
}

/** 지금 학기부터 과거로 count 개 */
export function recentSemesters(count = 4, now: Date = new Date()): SemesterOption[] {
  const [yRaw, nRaw] = semesterOf(now).split("-");
  let y = Number(yRaw);
  let n = Number(nRaw);

  return Array.from({ length: count }, () => {
    const value = `${y}-${n}`;
    if (n === 1) {
      y -= 1;
      n = 2;
    } else {
      n = 1;
    }
    return { value, label: semesterLabel(value) };
  });
}

/**
 * "8.22 (금)" 같은 화면 표기에서 올해 기준 ISO 날짜를 만든다.
 * 연도가 없으니 오늘에서 가장 가까운 해로 본다 — 12월 활동을 1월에 봐도
 * 지난 것으로 읽히게.
 */
export function isoFromLabel(label: string, now: Date = new Date()): string {
  const m = label.match(/(\d{1,2})\.(\d{1,2})/);
  if (!m) return "";
  const month = Number(m[1]);
  let year = now.getFullYear();
  if (now.getMonth() + 1 >= 10 && month <= 2) year += 1;
  if (now.getMonth() + 1 <= 2 && month >= 10) year -= 1;
  return `${year}-${String(month).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** 날짜(ISO 또는 "8.22 (금)" 표기)가 그 학기에 드는지 */
export function inSemester(dateish: string | null | undefined, value: string): boolean {
  if (!dateish) return false;
  const iso = /^\d{4}-\d{2}-\d{2}/.test(dateish) ? dateish : isoFromLabel(dateish);
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const { from, to } = semesterRange(value);
  return d >= from && d < to;
}
