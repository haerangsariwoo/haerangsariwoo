import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface MyTeam {
  activityId: string;
  eventTitle: string;
  teamNumber: number;
  teamName: string;
  members: { name: string; isLeader: boolean }[];
  dateLabel: string;
  place: string;
}

interface TeamEventRow {
  id: string;
  activity_id: string;
  activities: { title: string; date_label: string; place: string; type: string } | null;
}

interface AssignmentRow {
  member_id: string;
  team_number: number | null;
  is_leader: boolean;
  members: { name: string } | null;
}

/**
 * 지금 발행 중인 조 편성에서 내가 속한 조.
 * 발행된 행사가 없거나, 내가 참여자가 아니거나, 아직 조가 안 정해졌으면 null.
 */
export const getMyTeam = cache(async (): Promise<MyTeam | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: event } = await supabase
    .from("team_events")
    .select("id, activity_id, activities(title, date_label, place, type)")
    .eq("published", true)
    .limit(1)
    .maybeSingle();

  const ev = event as unknown as TeamEventRow | null;
  if (!ev) return null;

  const { data: rows } = await supabase
    .from("team_assignments")
    .select("member_id, team_number, is_leader, members(name)")
    .eq("team_event_id", ev.id);

  const assignments = (rows ?? []) as unknown as AssignmentRow[];
  const mine = assignments.find((a) => a.member_id === user.id);
  if (!mine || mine.team_number === null) return null;

  // 조장을 맨 위로 — 조원 목록에서 누가 연락 창구인지 먼저 보여야 한다
  const members = assignments
    .filter((a) => a.team_number === mine.team_number && a.members?.name)
    .map((a) => ({ name: a.members!.name, isLeader: a.is_leader }))
    .sort((a, b) => Number(b.isLeader) - Number(a.isLeader));

  return {
    activityId: ev.activity_id,
    eventTitle: ev.activities?.title ?? "행사",
    teamNumber: mine.team_number,
    teamName: `${ev.activities?.type ?? ""} ${mine.team_number}조`.trim(),
    members,
    dateLabel: ev.activities?.date_label ?? "",
    place: ev.activities?.place ?? "",
  };
});
