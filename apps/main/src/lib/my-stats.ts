import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ddayFromShort } from "@/lib/activities";

export type RecordState = "참여확정" | "신청완료" | "대기" | "활동완료" | "취소" | "불참";

export interface ActivityRecord {
  id: string;
  title: string;
  /** "2026.08.22" */
  date: string;
  hours: number | null;
  state: RecordState;
}

export interface BadgeItem {
  id: string;
  label: string;
  desc: string;
  earned: boolean;
}

export interface NextThing {
  title: string;
  place: string;
  dateLabel: string;
  meta: string;
  dday: number;
}

export interface MyStats {
  /** 승인된 1365·VMS 증빙 시간의 합. 내부봉사는 시간이 아니라 횟수로 센다 */
  totalHours: number;
  /** 참여확정 내부봉사 + 승인 증빙 */
  totalActivities: number;
  semesterHours: number;
  semesterGoal: number;
  semesterJoinCount: number;
  /** 참여확정 대비 실제 참석 비율. 확정된 활동이 없으면 100 */
  attendanceRate: number;
  records: ActivityRecord[];
  badges: BadgeItem[];
  nextThing: NextThing | null;
}

/** 학기 목표 시간 — 아직 설정 화면이 없어 한 곳에 모아 둔다 */
const SEMESTER_GOAL = 20;

/**
 * 오늘이 속한 학기의 시작·끝. 3~8월이 1학기, 9~2월이 2학기다.
 * DB에 학기 컬럼이 없어 날짜로 가른다 — 관리자 학기 선택기와 같은 기준이다.
 */
function semesterRange(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (m >= 3 && m <= 8) return { from: new Date(y, 2, 1), to: new Date(y, 8, 1) };
  if (m >= 9) return { from: new Date(y, 8, 1), to: new Date(y + 1, 2, 1) };
  return { from: new Date(y - 1, 8, 1), to: new Date(y, 2, 1) };
}

function inRange(iso: string, from: Date, to: Date) {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d >= from && d < to;
}

/** "2026-08-22" → "2026.08.22" */
function dotted(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** 활동일 표기("8.22 (토)")에서 올해 기준 ISO 날짜를 만든다 */
function isoFromLabel(label: string) {
  const m = label.match(/(\d{1,2})\.(\d{1,2})/);
  if (!m) return "";
  const now = new Date();
  const month = Number(m[1]);
  let year = now.getFullYear();
  // 연말·연초를 넘나드는 표기를 오늘에서 가장 가까운 해로 본다
  if (now.getMonth() + 1 >= 10 && month <= 2) year += 1;
  if (now.getMonth() + 1 <= 2 && month >= 10) year -= 1;
  return `${year}-${String(month).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

interface AppRow {
  id: string;
  state: "신청완료" | "참여확정" | "대기" | "불참" | "노쇼";
  applied_at: string;
  internal_activities: {
    title: string;
    date_label: string;
    time_label: string;
    place: string;
    category: string;
    capacity: number;
  } | null;
}

interface ProofRow {
  id: string;
  activity_title: string;
  activity_date: string;
  hours: number;
  status: "대기" | "승인" | "반려";
}

interface RsvpRow {
  activities: {
    title: string;
    date_label: string;
    date_short: string;
    time_label: string;
    place: string;
    type: string;
    status: string;
  } | null;
}

/**
 * MY·홈에 쓰는 내 활동 통계 전부. 한 요청 안에서 여러 번 불러도
 * React cache 덕분에 조회는 한 번만 나간다.
 */
export const getMyStats = cache(async (): Promise<MyStats> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: MyStats = {
    totalHours: 0,
    totalActivities: 0,
    semesterHours: 0,
    semesterGoal: SEMESTER_GOAL,
    semesterJoinCount: 0,
    attendanceRate: 100,
    records: [],
    badges: [],
    nextThing: null,
  };
  if (!user) return empty;

  const [{ data: appData }, { data: proofData }, { data: rsvpData }] = await Promise.all([
    supabase
      .from("internal_activity_applications")
      .select(
        "id, state, applied_at, internal_activities(title, date_label, time_label, place, category, capacity)",
      )
      .eq("member_id", user.id),
    supabase
      .from("proof_submissions")
      .select("id, activity_title, activity_date, hours, status")
      .eq("member_id", user.id),
    supabase
      .from("activity_rsvps")
      .select("activities(title, date_label, date_short, time_label, place, type, status)")
      .eq("member_id", user.id)
      .eq("state", "참석"),
  ]);

  const apps = (appData ?? []) as unknown as AppRow[];
  const proofs = (proofData ?? []) as ProofRow[];
  const rsvps = (rsvpData ?? []) as unknown as RsvpRow[];

  const approved = proofs.filter((p) => p.status === "승인");
  const confirmed = apps.filter((a) => a.state === "참여확정");
  const missed = apps.filter((a) => a.state === "불참" || a.state === "노쇼");

  const totalHours = approved.reduce((s, p) => s + Number(p.hours), 0);
  const totalActivities = confirmed.length + approved.length;

  const { from, to } = semesterRange();
  const semesterHours = approved
    .filter((p) => inRange(p.activity_date, from, to))
    .reduce((s, p) => s + Number(p.hours), 0);
  const semesterJoinCount = confirmed.filter((a) =>
    inRange(isoFromLabel(a.internal_activities?.date_label ?? ""), from, to),
  ).length;

  const attendedTotal = confirmed.length + missed.length;
  const attendanceRate =
    attendedTotal === 0 ? 100 : Math.round((confirmed.length / attendedTotal) * 100);

  // ---- 활동 기록 ----
  const records: ActivityRecord[] = [
    ...apps.map((a) => ({
      id: `app-${a.id}`,
      title: a.internal_activities?.title ?? "(삭제된 봉사)",
      date: isoFromLabel(a.internal_activities?.date_label ?? "").replace(/-/g, ".") || "—",
      hours: null,
      // 노쇼도 부원 화면에서는 "불참" 으로 묶어 보여준다
      state: (a.state === "노쇼" ? "불참" : a.state) as RecordState,
    })),
    ...approved.map((p) => ({
      id: `proof-${p.id}`,
      title: p.activity_title,
      date: dotted(p.activity_date),
      hours: Number(p.hours),
      state: "활동완료" as RecordState,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // ---- 배지 ----
  const categories = new Set(
    confirmed.map((a) => a.internal_activities?.category).filter(Boolean) as string[],
  );
  const activeMonths = new Set([
    ...approved.map((p) => p.activity_date.slice(0, 7)),
    ...confirmed.map((a) => isoFromLabel(a.internal_activities?.date_label ?? "").slice(0, 7)),
  ]);
  activeMonths.delete("");

  const badges: BadgeItem[] = [
    { id: "b1", label: "첫 봉사", desc: "첫 봉사활동 참여", earned: totalActivities >= 1 },
    { id: "b2", label: "새로운 분야", desc: "3개 분야 이상 참여", earned: categories.size >= 3 },
    {
      id: "b3",
      label: "연속 참여",
      desc: "3개월 연속 참여",
      earned: hasStreak([...activeMonths], 3),
    },
    { id: "b4", label: "열 번의 나눔", desc: "활동 10회 이상 참여", earned: totalActivities >= 10 },
    { id: "b5", label: "스무 시간", desc: "누적 봉사 20시간 달성", earned: totalHours >= 20 },
    {
      id: "b6",
      label: "개근",
      desc: "확정한 활동에 3회 이상 빠짐없이 참여",
      earned: confirmed.length >= 3 && missed.length === 0,
    },
  ];

  // ---- 다음 활동 ----
  const upcoming: NextThing[] = [];
  for (const a of apps) {
    const info = a.internal_activities;
    if (!info || a.state === "불참" || a.state === "노쇼") continue;
    const dday = ddayFromShort(info.date_label);
    if (dday === null || dday < 0) continue;
    upcoming.push({
      title: info.title,
      place: info.place,
      dateLabel: `${info.date_label}${info.time_label ? ` · ${info.time_label}` : ""}`,
      meta: a.state === "참여확정" ? "참여 확정" : a.state,
      dday,
    });
  }
  for (const r of rsvps) {
    const info = r.activities;
    if (!info || info.status === "done") continue;
    const dday = ddayFromShort(info.date_short);
    if (dday === null || dday < 0) continue;
    upcoming.push({
      title: info.title,
      place: info.place,
      dateLabel: `${info.date_label}${info.time_label ? ` · ${info.time_label}` : ""}`,
      meta: `${info.type} · 참석`,
      dday,
    });
  }
  upcoming.sort((a, b) => a.dday - b.dday);

  return {
    totalHours,
    totalActivities,
    semesterHours,
    semesterGoal: SEMESTER_GOAL,
    semesterJoinCount,
    attendanceRate,
    records,
    badges,
    nextThing: upcoming[0] ?? null,
  };
});

/** "2026-08" 같은 달 목록에 n개월 연속이 있는지 */
function hasStreak(months: string[], n: number) {
  const sorted = [...months].sort();
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const [py, pm] = sorted[i - 1].split("-").map(Number);
    const [cy, cm] = sorted[i].split("-").map(Number);
    const gap = (cy - py) * 12 + (cm - pm);
    run = gap === 1 ? run + 1 : 1;
    if (run >= n) return true;
  }
  return sorted.length >= n && run >= n;
}
