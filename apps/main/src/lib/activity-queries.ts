import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ddayFromShort, type Activity, type ActivityStatus, type ActivityTone, type ActivityType, type AttendState } from "@/lib/activities";

export interface ActivityRow {
  id: string;
  type: ActivityType;
  title: string;
  date_label: string;
  date_short: string;
  weekday: string;
  time_label: string;
  place: string;
  target: string;
  tone: ActivityTone;
  intro: string;
  notes: string[];
  status: ActivityStatus;
  created_at: string;
}

export function toActivity(
  r: ActivityRow,
  attend: AttendState | null,
  teamPublished: boolean,
): Activity {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    dateLabel: r.date_label,
    dateShort: r.date_short,
    weekday: r.weekday,
    timeLabel: r.time_label,
    place: r.place,
    target: r.target,
    tone: r.tone,
    intro: r.intro,
    notes: r.notes,
    status: r.status,
    dday: r.status === "done" ? null : ddayFromShort(r.date_short),
    attend,
    teamPublished,
  };
}

/** 다가오는 활동은 가까운 순, 지난 활동은 최근 순으로 본다 */
function sortActivities(list: Activity[]) {
  return [...list].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const av = ddayFromShort(a.dateShort) ?? 9999;
    const bv = ddayFromShort(b.dateShort) ?? 9999;
    return a.status === "done" ? bv - av : av - bv;
  });
}

/** 로그인한 부원 기준의 활동 목록 — 본인 참석 응답과 조 편성 공개 여부가 함께 붙는다 */
export const getActivities = cache(async (): Promise<Activity[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rows }, { data: rsvps }, { data: teamEvents }] = await Promise.all([
    supabase.from("activities").select("*"),
    user
      ? supabase.from("activity_rsvps").select("activity_id, state").eq("member_id", user.id)
      : Promise.resolve({ data: [] as { activity_id: string; state: AttendState }[] }),
    supabase.from("team_events").select("activity_id").eq("published", true),
  ]);

  const mine = new Map(
    ((rsvps ?? []) as { activity_id: string; state: AttendState }[]).map((r) => [
      r.activity_id,
      r.state,
    ]),
  );
  const published = new Set(
    ((teamEvents ?? []) as { activity_id: string }[]).map((t) => t.activity_id),
  );

  return sortActivities(
    ((rows ?? []) as ActivityRow[]).map((r) =>
      toActivity(r, mine.get(r.id) ?? null, published.has(r.id)),
    ),
  );
});

export async function getActivity(id: string): Promise<Activity | null> {
  const all = await getActivities();
  return all.find((a) => a.id === id) ?? null;
}
