export type SeatGender = "남" | "여";

export interface Seat {
  id: string;
  name: string;
  gender: SeatGender;
  staff: boolean;
}

const shuffled = <T,>(list: T[]): T[] => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * 운영진은 원래 테이블에 남기고, 나머지만 섞는다.
 * 남자를 먼저 "전체 남녀 비율에 비해 남자가 가장 모자란" 테이블로 보내고
 * 여자로 남은 자리를 채운다. 그래서 테이블마다 성비가 전체 성비에 가깝다.
 */
function arrangeOnce(tables: Seat[][], evenSizes: boolean): Seat[][] {
  const staff = tables.map((t) => t.filter((p) => p.staff));
  const pool = tables.flat().filter((p) => !p.staff);
  const everyone = tables.flat();
  const maleRatio = everyone.length
    ? everyone.filter((p) => p.gender === "남").length / everyone.length
    : 0;

  // 테이블별 자리 수 — 고르게 맞출 때는 가장 적은 테이블부터 한 명씩 채운다
  let size: number[];
  if (evenSizes) {
    size = staff.map((s) => s.length);
    for (let left = pool.length; left > 0; left--) {
      const min = Math.min(...size);
      const candidates = size.flatMap((v, i) => (v === min ? [i] : []));
      size[candidates[Math.floor(Math.random() * candidates.length)]]++;
    }
  } else {
    size = tables.map((t) => t.length);
  }

  const result = staff.map((s) => s.slice());
  const males = result.map((t) => t.filter((p) => p.gender === "남").length);
  const place = (p: Seat, want: (t: number) => number) => {
    let best = -1;
    let bestScore = -Infinity;
    for (let t = 0; t < result.length; t++) {
      if (result[t].length >= size[t]) continue;
      const score = want(t) + Math.random() * 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    result[best].push(p);
    if (p.gender === "남") males[best]++;
  };

  shuffled(pool.filter((p) => p.gender === "남")).forEach((p) =>
    place(p, (t) => size[t] * maleRatio - males[t]),
  );
  shuffled(pool.filter((p) => p.gender !== "남")).forEach((p) =>
    place(p, (t) => size[t] * (1 - maleRatio) - (result[t].length - males[t])),
  );

  return result.map(seatOrder);
}

/** 한 테이블 안에서 남녀가 번갈아 앉고, 운영진은 사이사이 흩어 앉는다 */
function seatOrder(table: Seat[]): Seat[] {
  const staff = shuffled(table.filter((p) => p.staff));
  const m = shuffled(table.filter((p) => !p.staff && p.gender === "남"));
  const f = shuffled(table.filter((p) => !p.staff && p.gender !== "남"));
  const out: Seat[] = [];
  while (m.length || f.length) {
    const last = out[out.length - 1]?.gender;
    const takeMale = m.length > 0 && (f.length === 0 || last !== "남" || m.length > f.length);
    out.push((takeMale ? m.shift() : f.shift())!);
  }
  staff.forEach((p, k) => {
    const at = Math.round((k * (out.length + 1)) / staff.length) + k;
    out.splice(Math.min(at, out.length), 0, p);
  });
  return out;
}

/**
 * 여러 번 섞어 보고, 원래 테이블에 그대로 남는 사람이 가장 적은 결과를 고른다.
 * `stayed` 는 운영진을 뺀 인원 중 같은 테이블에 다시 앉은 수다.
 */
export function shuffleTables(tables: Seat[][], evenSizes: boolean, tries = 60) {
  const before = new Map<string, number>();
  tables.forEach((t, i) => t.forEach((p) => before.set(p.id, i)));

  let best = tables;
  let bestStayed = Infinity;
  for (let k = 0; k < tries && bestStayed > 0; k++) {
    const next = arrangeOnce(tables, evenSizes);
    let stayed = 0;
    next.forEach((t, i) => t.forEach((p) => !p.staff && before.get(p.id) === i && stayed++));
    if (stayed < bestStayed) {
      bestStayed = stayed;
      best = next;
    }
  }
  const movable = tables.flat().filter((p) => !p.staff).length;
  return { tables: best, moved: movable - bestStayed };
}
