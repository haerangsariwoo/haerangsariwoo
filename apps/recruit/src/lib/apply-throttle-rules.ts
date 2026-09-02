/**
 * "몇 번 틀렸으니 막는다" 를 정하는 계산만 따로 뒀다.
 * 표를 읽고 쓰는 일과 섞여 있으면 맞는지 확인해 볼 수가 없다.
 */

export const WINDOW_MS = 30 * 60 * 1000;

/** 한 사람의 번호를 계속 찍는 경우 */
export const MAX_PER_APPLICANT = 5;

/**
 * 학번을 바꿔가며 훑는 경우. 같은 공간(기숙사·강의실)에서 여러 명이 동시에
 * 쓰면 주소가 같을 수 있어 넉넉히 잡는다.
 */
export const MAX_PER_ADDRESS = 30;

export interface Gate {
  key: string;
  max: number;
}

export interface AttemptRow {
  key: string;
  fails: number;
  first_at: string;
}

export interface ThrottleGate {
  blocked: boolean;
  /** 다시 시도할 수 있을 때까지 남은 분 */
  retryAfterMinutes: number;
}

/**
 * 주소만으로 막으면 다른 주소에서 계속 찍을 수 있고, 학번만으로 막으면
 * 남의 학번을 일부러 5번 틀려 그 사람을 못 들어오게 만들 수 있다.
 * 그래서 둘을 묶은 자리와 주소만의 자리를 함께 센다.
 */
export function gatesFor(address: string, studentId: string): Gate[] {
  return [
    { key: `pair:${address}:${studentId}`, max: MAX_PER_APPLICANT },
    { key: `addr:${address}`, max: MAX_PER_ADDRESS },
  ];
}

/** 30분이 지난 기록은 없던 것으로 본다 */
export function isStale(row: AttemptRow, now: number) {
  return now - new Date(row.first_at).getTime() >= WINDOW_MS;
}

/** 지금 막혀 있는가. 막혀 있다면 몇 분 뒤에 풀리는가 */
export function decideBlock(rows: AttemptRow[], gates: Gate[], now: number): ThrottleGate {
  let waitMs = 0;

  for (const gate of gates) {
    const row = rows.find((r) => r.key === gate.key);
    if (!row || isStale(row, now) || row.fails < gate.max) continue;
    waitMs = Math.max(waitMs, new Date(row.first_at).getTime() + WINDOW_MS - now);
  }

  if (waitMs <= 0) return { blocked: false, retryAfterMinutes: 0 };
  return { blocked: true, retryAfterMinutes: Math.max(1, Math.ceil(waitMs / 60_000)) };
}

/** 한 번 틀렸을 때 표에 넣을 값 */
export function nextCounts(rows: AttemptRow[], gates: Gate[], now: number) {
  const nowIso = new Date(now).toISOString();

  return gates.map((gate) => {
    const row = rows.find((r) => r.key === gate.key);
    const fresh = !row || isStale(row, now);
    return {
      key: gate.key,
      fails: fresh ? 1 : row.fails + 1,
      first_at: fresh ? nowIso : row.first_at,
      updated_at: nowIso,
    };
  });
}

/** 막혔을 때 지원자에게 보여줄 문구 */
export function blockedMessage(gate: ThrottleGate) {
  return `비밀번호를 여러 번 잘못 입력했어요. ${gate.retryAfterMinutes}분 뒤에 다시 시도해 주세요.`;
}
