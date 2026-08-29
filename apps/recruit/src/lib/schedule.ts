/**
 * 모집 일정 계산.
 *
 * 접수와 발표가 정해둔 시각에 스스로 움직이게 한다. 화면 조각과 떼어
 * 두는 이유는, 경계(시작 직전·마감 직후)가 많아 눈으로만 보고는 맞는지
 * 확인할 수가 없기 때문이다.
 */

const DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function parse(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 정해둔 시각이 지났는가. 시각이 없거나 깨졌으면 "아직" 으로 본다 */
export function isDue(at: string | null | undefined, now = new Date()) {
  const d = parse(at);
  return d !== null && d.getTime() <= now.getTime();
}

export type ApplyPhase = "before" | "open" | "closed";

export interface ApplyWindow {
  /** 운영진 토글 — 시각을 안 정해뒀을 때만 쓴다 */
  applicationsOpen: boolean;
  applyStartAt: string | null;
  applyEndAt: string | null;
}

/**
 * 지금 접수를 받는 때인가.
 *
 * 시각을 하나라도 정해두면 시각이 결정한다 — 그러라고 정해두는 것이다.
 * 둘 다 비어 있으면 예전처럼 운영진 토글을 따른다.
 *
 * 토글만 꺼져 있을 때는 "마감" 이 아니라 "아직" 으로 본다. 마감은 이번
 * 모집이 끝났다는 뜻인데, 일정 없이 꺼둔 상태는 대개 다음 모집을 준비
 * 중인 때다. 진짜 마감은 마감 시각을 정해뒀을 때만 알 수 있다.
 */
export function applyPhase(w: ApplyWindow, now = new Date()): ApplyPhase {
  const start = parse(w.applyStartAt);
  const end = parse(w.applyEndAt);

  if (!start && !end) return w.applicationsOpen ? "open" : "before";
  if (start && now.getTime() < start.getTime()) return "before";
  if (end && now.getTime() > end.getTime()) return "closed";
  return "open";
}

export function isApplyOpen(w: ApplyWindow, now = new Date()) {
  return applyPhase(w, now) === "open";
}

export interface PublishInput {
  /** 운영진이 손으로 발표한 상태 */
  published: boolean;
  /** 예약해 둔 발표 시각 */
  at: string | null;
  /** 아직 결과를 정하지 않은 지원자 수 */
  pending: number;
}

export type PublishState =
  | { published: true; reason: "manual" | "scheduled" }
  /** 예약 시각은 됐는데 심사가 안 끝나 열지 못한 상태 — 운영진에게 알려야 한다 */
  | { published: false; reason: "waiting" | "blocked" };

/**
 * 발표되었는가.
 *
 * 예약 시각이 왔어도 심사가 안 끝났으면 열지 않는다. 결과가 "대기" 인
 * 채로 공개하면 지원자는 자기가 떨어진 줄 안다. 늦게 나가는 편이 낫다.
 */
export function publishState(input: PublishInput, now = new Date()): PublishState {
  if (input.published) return { published: true, reason: "manual" };
  if (!isDue(input.at, now)) return { published: false, reason: "waiting" };
  if (input.pending > 0) return { published: false, reason: "blocked" };
  return { published: true, reason: "scheduled" };
}

export function isPublished(input: PublishInput, now = new Date()) {
  return publishState(input, now).published;
}

/* ---------- 화면 표기 ---------- */

/** "9.08 (월)" */
export function formatDay(iso: string | null | undefined) {
  const d = parse(iso);
  if (!d) return "";
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")} (${DAYS[d.getDay()]})`;
}

/** "9.08 (월) 오전 10시" — 정시가 아니면 분까지 적는다 */
export function formatDayTime(iso: string | null | undefined) {
  const d = parse(iso);
  if (!d) return "";

  const h = d.getHours();
  const m = d.getMinutes();
  const half = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time = m === 0 ? `${half} ${h12}시` : `${half} ${h12}시 ${m}분`;

  return `${formatDay(iso)} ${time}`;
}

/** <input type="datetime-local"> 이 읽는 형태 */
export function toLocalInput(iso: string | null | undefined) {
  const d = parse(iso);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 입력칸의 값을 저장할 형태로. 비우면 null — 자동으로 움직이지 않는다는 뜻 */
export function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
