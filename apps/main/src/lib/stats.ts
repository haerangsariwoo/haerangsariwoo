import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType, AttendState } from "@/lib/activities";

export type StatTone = "blue" | "green" | "orange" | "purple";

export interface AdminStats {
  /** 승인된 증빙 기준 월별 봉사시간 (올해) */
  monthly: { month: string; hours: number }[];
  totalHours: number;
  /** 참여확정된 내부봉사의 분야 비중 (%) */
  categories: { label: string; value: number; tone: StatTone }[];
  /** 활동 유형별 등록 건수 */
  typeCounts: { type: ActivityType; count: number }[];
  /** 전 부원의 활동 참석 응답 집계 */
  attendCounts: { label: string; count: number }[];
}

const CATEGORY_TONES: StatTone[] = ["blue", "green", "orange", "purple"];

/** 관리자 통계는 전부 실제 표에서 계산한다 — 따로 저장해 두는 값이 없다 */
export const getAdminStats = cache(async (): Promise<AdminStats> => {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const [{ data: proofs }, { data: apps }, { data: acts }, { data: rsvps }] = await Promise.all([
    supabase.from("proof_submissions").select("hours, activity_date").eq("status", "승인"),
    supabase
      .from("internal_activity_applications")
      .select("state, internal_activities(category)")
      .eq("state", "참여확정"),
    supabase.from("activities").select("type"),
    supabase.from("activity_rsvps").select("state"),
  ]);

  // ---- 월별 봉사시간 ----
  const byMonth = new Map<number, number>();
  for (const p of (proofs ?? []) as { hours: number; activity_date: string }[]) {
    const d = new Date(p.activity_date);
    if (d.getFullYear() !== year) continue;
    byMonth.set(d.getMonth(), (byMonth.get(d.getMonth()) ?? 0) + p.hours);
  }
  const months = [...byMonth.keys()].sort((a, b) => a - b);
  const monthly = (months.length > 0 ? months : [new Date().getMonth()]).map((m) => ({
    month: `${m + 1}월`,
    hours: byMonth.get(m) ?? 0,
  }));
  const totalHours = monthly.reduce((s, m) => s + m.hours, 0);

  // ---- 분야별 비중 ----
  const byCategory = new Map<string, number>();
  for (const a of (apps ?? []) as unknown as {
    internal_activities: { category: string } | null;
  }[]) {
    const c = a.internal_activities?.category;
    if (!c) continue;
    byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
  }
  const categoryTotal = [...byCategory.values()].reduce((s, v) => s + v, 0);
  const categories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], i) => ({
      label,
      value: categoryTotal === 0 ? 0 : Math.round((count / categoryTotal) * 100),
      tone: CATEGORY_TONES[i % CATEGORY_TONES.length],
    }));

  // ---- 활동 유형별 건수 ----
  const byType = new Map<ActivityType, number>();
  for (const a of (acts ?? []) as { type: ActivityType }[]) {
    byType.set(a.type, (byType.get(a.type) ?? 0) + 1);
  }
  const typeCounts = [...byType.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // ---- 참석 응답 ----
  const byState = new Map<AttendState, number>();
  for (const r of (rsvps ?? []) as { state: AttendState }[]) {
    byState.set(r.state, (byState.get(r.state) ?? 0) + 1);
  }
  const attendCounts = (["참석", "미정", "불참"] as AttendState[]).map((label) => ({
    label,
    count: byState.get(label) ?? 0,
  }));

  return { monthly, totalHours, categories, typeCounts, attendCounts };
});
