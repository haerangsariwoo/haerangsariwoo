import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ddayFromShort } from "@/lib/activities";

export interface DashboardMetric {
  label: string;
  value: string;
  caption: string;
  tone: "blue" | "green" | "orange" | "purple";
  icon: string;
}

export interface TodayVolunteer {
  id: string;
  title: string;
  time: string;
  applied: string;
  attended: string;
  status: string;
  tone: "blue" | "green" | "grey";
}

export interface PendingHour {
  id: string;
  name: string;
  activity: string;
  hours: string;
  tone: "blue" | "green" | "orange";
}

export interface UpcomingEvent {
  id: string;
  date: string;
  title: string;
  time: string;
  dday: number;
  tone: "blue" | "orange";
}

export interface DashboardData {
  metrics: DashboardMetric[];
  todayVolunteers: TodayVolunteer[];
  pendingHours: PendingHour[];
  upcoming: UpcomingEvent[];
  pendingHourCount: number;
}

const TONES = ["blue", "green", "orange"] as const;

interface ActivityRow {
  id: string;
  title: string;
  date_label: string;
  time_label: string;
  capacity: number;
  status: "open" | "closed";
}

interface AppRow {
  activity_id: string;
  state: string;
}

interface ProofRow {
  id: string;
  activity_title: string;
  hours: number;
  member: { name: string } | null;
}

/**
 * 운영진 대시보드에 올리는 값들. 전부 실제 표에서 세어 온다.
 * "오늘"은 활동일 표기(8.22 같은)를 오늘과 견줘 가른다 — 내부봉사에
 * 날짜 컬럼이 따로 없어서다.
 */
export const getDashboard = cache(async (): Promise<DashboardData> => {
  const supabase = await createClient();

  const [
    { data: acts },
    { data: apps },
    { data: proofs },
    { count: pendingMembers },
    { data: events },
  ] = await Promise.all([
    supabase.from("internal_activities").select("id, title, date_label, time_label, capacity, status"),
    supabase.from("internal_activity_applications").select("activity_id, state"),
    supabase
      .from("proof_submissions")
      .select("id, activity_title, hours, member:member_id(name)")
      .eq("status", "대기")
      .order("created_at", { ascending: false }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("activities").select("id, title, date_label, date_short, time_label, status"),
  ]);

  const activities = (acts ?? []) as ActivityRow[];
  const applications = (apps ?? []) as AppRow[];
  const pending = (proofs ?? []) as unknown as ProofRow[];

  // 활동별 신청·확정 집계
  const appliedBy = new Map<string, number>();
  const confirmedBy = new Map<string, number>();
  for (const a of applications) {
    if (a.state === "불참" || a.state === "노쇼") continue;
    appliedBy.set(a.activity_id, (appliedBy.get(a.activity_id) ?? 0) + 1);
    if (a.state === "참여확정") {
      confirmedBy.set(a.activity_id, (confirmedBy.get(a.activity_id) ?? 0) + 1);
    }
  }

  // ---- 오늘의 봉사 ----
  const todayList = activities.filter((v) => ddayFromShort(v.date_label) === 0);
  const todayVolunteers: TodayVolunteer[] = todayList.map((v) => ({
    id: v.id,
    title: v.title,
    time: v.time_label || "시간 미정",
    applied: `${appliedBy.get(v.id) ?? 0} / ${v.capacity}`,
    attended: `${confirmedBy.get(v.id) ?? 0}명`,
    status: v.status === "closed" ? "모집 마감" : "진행 예정",
    tone: v.status === "closed" ? "grey" : "blue",
  }));

  // ---- 승인 대기 증빙 ----
  const pendingHours: PendingHour[] = pending.slice(0, 5).map((p, i) => ({
    id: p.id,
    name: p.member?.name ?? "(탈퇴)",
    activity: p.activity_title,
    hours: `${p.hours}시간`,
    tone: TONES[i % TONES.length],
  }));

  /** 동아리 활동은 내부봉사와 달리 status 값이 upcoming/today/closed/done 이다 */
  interface EventRow {
    id: string;
    title: string;
    date_short: string;
    time_label: string;
    status: string;
  }

  // ---- 다가오는 일정 (동아리 활동) ----
  const upcoming: UpcomingEvent[] = ((events ?? []) as EventRow[])
    .filter((e) => e.status !== "done")
    .map((e) => ({
      id: e.id,
      date: e.date_short,
      title: e.title,
      time: e.time_label || "",
      dday: ddayFromShort(e.date_short) ?? 9999,
      tone: "blue" as const,
    }))
    .filter((e) => e.dday >= 0)
    .sort((a, b) => a.dday - b.dday)
    .slice(0, 4)
    .map((e, i) => ({ ...e, tone: i === 0 ? ("orange" as const) : ("blue" as const) }));

  // ---- 상단 지표 ----
  const confirmedToday = todayList.reduce((s, v) => s + (confirmedBy.get(v.id) ?? 0), 0);
  const appliedToday = todayList.reduce((s, v) => s + (appliedBy.get(v.id) ?? 0), 0);
  const rate = appliedToday === 0 ? 0 : Math.round((confirmedToday / appliedToday) * 100);

  const metrics: DashboardMetric[] = [
    {
      label: "오늘 봉사",
      value: `${todayList.length}건`,
      caption: todayList.length > 0 ? "진행 예정" : "일정 없음",
      tone: "blue",
      icon: "sun",
    },
    {
      label: "오늘 참여 확정",
      value: appliedToday > 0 ? `${confirmedToday} / ${appliedToday}명` : "—",
      caption: appliedToday > 0 ? `${rate}% 확정` : "신청 없음",
      tone: "green",
      icon: "check",
    },
    {
      label: "미승인 봉사시간",
      value: `${pending.length}건`,
      caption: pending.length > 0 ? "검토 필요" : "모두 처리됨",
      tone: "orange",
      icon: "alert",
    },
    {
      label: "가입 승인 대기",
      value: `${pendingMembers ?? 0}명`,
      caption: (pendingMembers ?? 0) > 0 ? "검토 필요" : "모두 처리됨",
      tone: "purple",
      icon: "plus",
    },
  ];

  return { metrics, todayVolunteers, pendingHours, upcoming, pendingHourCount: pending.length };
});
