/**
 * 운영진은 "9.8 (월) 10:00~18:00, 20분 간격" 처럼 하루치를 한 줄로 등록한다.
 * 지원자에게는 그걸 쪼개서 10:00 · 10:20 · 10:40 … 하나하나를 고르게 해야 한다.
 *
 * 쪼개는 계산을 여기 한 곳에 둔다. 서버(예약 처리)와 화면(고르기·미리보기)이
 * 같은 규칙을 써야 "화면엔 있는데 눌러보니 없는 시간" 이 생기지 않는다.
 */

export const INTERVAL_OPTIONS = ["10분", "15분", "20분", "30분"] as const;

export function intervalMinutes(label: string) {
  const n = Number.parseInt(label, 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

/** "10:00~18:00", "13:00 – 17:00", "13:00-17:00" 을 모두 받아들인다 */
export function parseRange(timeRange: string): { start: number; end: number } | null {
  const m = timeRange.match(/(\d{1,2}):(\d{2})\s*[~\-–—]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;

  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return { start, end };
}

export function hhmm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 운영진이 등록한 하루치 */
export interface SlotSource {
  id: string;
  slot_date: string;
  time_range: string;
  interval_label: string;
  capacity: number;
}

/** 지원자가 실제로 고르는 한 칸 */
export interface SlotTime {
  /** "{슬롯id}@{시각}" — 예약 요청에 이대로 실려 온다 */
  id: string;
  date: string;
  /** "10:20" */
  time: string;
  /** "10:40" — 몇 시까지인지 보여줄 때 쓴다 */
  endTime: string;
  /** "9.8 (월) 10:20" — applicants.interview 에 저장되는 값 */
  label: string;
  capacity: number;
}

/** 간격을 1분으로 잘못 넣어도 화면이 터지지 않게 한다 */
const MAX_TIMES_PER_DAY = 200;

export function expandSlot(slot: SlotSource): SlotTime[] {
  const range = parseRange(slot.time_range);

  // 시간을 읽지 못하면 예전처럼 통째로 한 칸으로 둔다.
  // 이 형태로 이미 예약한 지원자의 값과도 맞아떨어진다.
  if (!range) {
    return [
      {
        id: `${slot.id}@`,
        date: slot.slot_date,
        time: slot.time_range,
        endTime: "",
        label: `${slot.slot_date} ${slot.time_range}`.trim(),
        capacity: slot.capacity,
      },
    ];
  }

  const step = intervalMinutes(slot.interval_label);
  const out: SlotTime[] = [];

  // 마지막 칸도 끝 시각 안에 온전히 들어와야 한다 (10:00~18:00 / 20분 → 17:40 까지)
  for (let at = range.start; at + step <= range.end; at += step) {
    if (out.length >= MAX_TIMES_PER_DAY) break;
    const time = hhmm(at);
    out.push({
      id: `${slot.id}@${time}`,
      date: slot.slot_date,
      time,
      endTime: hhmm(at + step),
      label: `${slot.slot_date} ${time}`,
      capacity: slot.capacity,
    });
  }

  return out;
}

export function expandAll(slots: SlotSource[]): SlotTime[] {
  return slots.flatMap(expandSlot);
}

/** 하루에 몇 칸이 나오는지 — 운영진 화면 미리보기용 */
export function timeCount(slot: SlotSource) {
  return expandSlot(slot).length;
}

/** 날짜별로 묶는다 — 지원자 화면이 날짜 아래에 시간을 늘어놓는다 */
export function groupByDate<T extends { date: string }>(times: T[]) {
  const order: string[] = [];
  const byDate = new Map<string, T[]>();

  for (const t of times) {
    if (!byDate.has(t.date)) {
      byDate.set(t.date, []);
      order.push(t.date);
    }
    byDate.get(t.date)!.push(t);
  }

  return order.map((date) => ({ date, times: byDate.get(date)! }));
}
