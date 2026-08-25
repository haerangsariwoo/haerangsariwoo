import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VolunteerSummary, VolunteerStatus, ThumbTone } from "@/lib/mock-data";

interface ActivityRow {
  id: string;
  title: string;
  date_label: string;
  time_label: string;
  place: string;
  category: string;
  capacity: number;
  intro: string;
  duties: string[];
  supplies: string[];
  cautions: string[];
  manager: string;
  status: "open" | "closed";
  created_at: string;
}

const TONES: ThumbTone[] = ["mint", "peach", "sky", "lavender"];

function toneFor(id: string): ThumbTone {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return TONES[sum % TONES.length];
}

/** 신청·참여확정·대기 상태는 "자리를 차지한" 신청으로 친다. 불참·노쇼는 뺀다. */
const COUNTS_TOWARD_CAPACITY = new Set(["신청완료", "참여확정", "대기"]);

function toSummary(row: ActivityRow, applied: number): VolunteerSummary {
  let status: VolunteerStatus;
  if (row.status === "closed") status = "closed";
  else if (row.capacity > 0 && applied >= row.capacity) status = "waitlist";
  else if (row.capacity > 0 && applied / row.capacity >= 0.8) status = "closing";
  else status = "open";

  return {
    id: row.id,
    title: row.title,
    org: "해랑사리우",
    dateLabel: row.capacity > 0 ? `${row.date_label} · ${row.capacity}명 모집` : row.date_label,
    timeLabel: row.time_label,
    place: row.place,
    creditHours: 0,
    applied,
    capacity: row.capacity,
    category: row.category,
    source: "internal",
    status,
    thumbTone: toneFor(row.id),
    intro: row.intro,
    duties: row.duties,
    supplies: row.supplies,
    cautions: row.cautions,
    manager: row.manager,
  };
}

/**
 * 신청 인원수는 "누가 신청했는지"와 달리 민감하지 않고 카드·상세 페이지에
 * 공개로 보여주는 값이라, RLS(본인 것만 조회)를 우회해 admin 클라이언트로
 * 집계한다 — 일반 부원 세션으로는 남의 신청 행을 못 읽는다.
 */
export const getInternalActivities = cache(async (): Promise<VolunteerSummary[]> => {
  const supabase = await createClient();
  const { data: activities } = await supabase
    .from("internal_activities")
    .select("*")
    .order("date_label", { ascending: true });
  if (!activities || activities.length === 0) return [];

  const admin = createAdminClient();
  const { data: apps } = await admin
    .from("internal_activity_applications")
    .select("activity_id, state");

  const countByActivity = new Map<string, number>();
  for (const a of apps ?? []) {
    if (COUNTS_TOWARD_CAPACITY.has(a.state)) {
      countByActivity.set(a.activity_id, (countByActivity.get(a.activity_id) ?? 0) + 1);
    }
  }

  return (activities as ActivityRow[]).map((row) => toSummary(row, countByActivity.get(row.id) ?? 0));
});

export const findInternalActivity = cache(async (id: string): Promise<VolunteerSummary | null> => {
  const all = await getInternalActivities();
  return all.find((v) => v.id === id) ?? null;
});

/** 로그인한 사람이 이 활동에 이미 신청했는지 — 본인 것만 보는 select_own 정책으로 충분하다 */
export async function getMyApplicationState(activityId: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("internal_activity_applications")
    .select("state")
    .eq("activity_id", activityId)
    .eq("member_id", user.id)
    .maybeSingle();

  return data?.state ?? null;
}
