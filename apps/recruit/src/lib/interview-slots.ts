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

/**
 * 저장된 면접 라벨("9.8 (월) 10:20")에서 실제 시각을 읽는다.
 *
 * 날짜는 운영진이 자유롭게 적는 값이라 못 읽을 수 있다. 그때는 null 을
 * 돌려주고, 부르는 쪽은 "아직 안 지났다" 로 본다 — 면접이 남았는데 끝난
 * 것처럼 보여주는 편이 그 반대보다 나쁘다.
 */
export function interviewMoment(label: string, now = new Date()): Date | null {
  const day = label.match(/(\d{1,2})\.(\d{1,2})/);
  if (!day) return null;

  const time = label.match(/(\d{1,2}):(\d{2})/);
  const at = new Date(
    now.getFullYear(),
    Number(day[1]) - 1,
    Number(day[2]),
    time ? Number(time[1]) : 23,
    time ? Number(time[2]) : 59,
  );
  if (Number.isNaN(at.getTime())) return null;

  // 라벨에는 연도가 없다. 12월 면접을 이듬해 1월에 조회하면 올해 12월로
  // 읽혀 "아직 안 온 면접" 이 되므로, 너무 먼 미래면 작년 것으로 본다.
  if (at.getTime() - now.getTime() > 180 * 24 * 60 * 60 * 1000) {
    at.setFullYear(at.getFullYear() - 1);
  }

  return at;
}

/** 면접 시각이 지났는가 */
export function interviewPassed(label: string | null, now = new Date()) {
  if (!label) return false;
  const at = interviewMoment(label, now);
  return at !== null && at.getTime() < now.getTime();
}

/**
 * 예약한 면접 시간의 정렬 기준.
 *
 * 시각으로 바꾸지 않고 월·일·시·분을 숫자 하나로 이어 붙인다 — 순서만
 * 필요한데 굳이 Date 로 만들면 시간대에 휘둘리고, 라벨에 없는 연도까지
 * 추측해야 한다. 면접은 며칠 안에 끝나므로 이걸로 충분하다.
 *
 * 아직 안 고른 사람은 맨 뒤로 보낸다.
 */
export function interviewSortKey(label: string | null | undefined) {
  if (!label) return Number.MAX_SAFE_INTEGER;

  const day = label.match(/(\d{1,2})\.(\d{1,2})/);
  if (!day) return Number.MAX_SAFE_INTEGER - 1;

  const time = label.match(/(\d{1,2}):(\d{2})/);
  const month = Number(day[1]);
  const date = Number(day[2]);
  const minutes = time ? Number(time[1]) * 60 + Number(time[2]) : 0;

  return ((month * 100 + date) * 24 + Math.floor(minutes / 60)) * 60 + (minutes % 60);
}

/** 예약한 시간이 이른 사람부터 — 안 고른 사람은 맨 뒤 */
export function byInterviewTime<T extends { interview: string | null }>(a: T, b: T) {
  return interviewSortKey(a.interview) - interviewSortKey(b.interview);
}
