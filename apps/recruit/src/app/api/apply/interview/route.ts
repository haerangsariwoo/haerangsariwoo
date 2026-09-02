import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  blockedMessage,
  checkAttempts,
  clearFailures,
  recordFailure,
} from "@/lib/apply-throttle";
import { expandAll, type SlotSource, type SlotTime } from "@/lib/interview-slots";
import { isInterviewLocked } from "@/lib/interview-lock";
import { readPublishFlags, type PublishSettings } from "@/lib/publish-queries";

/**
 * 1차 합격자가 면접 시간을 직접 고른다.
 *
 * 지원자는 로그인 계정이 없어 RLS 로 가릴 수가 없다. 그래서 학번 + 비밀번호를 매번 같이 받아 확인한 뒤 service key 로 처리한다 (결과 조회와
 * 같은 방식). 남은 자리 계산과 저장은 반드시 서버에서 한다 — 화면에서
 * 막아 봐야 요청을 직접 보내면 그만이다.
 */

async function verify(studentId: unknown, code: unknown) {
  if (typeof studentId !== "string" || typeof code !== "string") return null;

  const supabase = createAdminClient();
  const [{ data }, { data: settings }] = await Promise.all([
    supabase
      .from("applicants")
      .select("id, code, first_result, interview")
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("recruit_settings")
      .select("*")
      .eq("id", 1)
      .single(),
  ]);

  if (!data || data.code !== code) return null;

  const flags = await readPublishFlags(supabase, (settings ?? null) as PublishSettings | null);

  return {
    supabase,
    applicant: data as { id: string; first_result: string; interview: string | null },
    firstPublished: flags.first.published,
    finalPublished: flags.final.published,
    lockAt: (settings?.interview_lock_at as string | null | undefined) ?? null,
  };
}

/** 고를 수 있는 시간대와 남은 자리 */
export async function POST(request: Request) {
  const body = await request.json();
  const { studentId, code, slotId } = body ?? {};

  // 면접 시간 선택도 같은 번호로 들어오므로 여기서도 시도 횟수를 센다
  const gate = await checkAttempts(request, String(studentId ?? ""));
  if (gate.blocked) {
    return NextResponse.json({ error: blockedMessage(gate) }, { status: 429 });
  }

  const session = await verify(studentId, code);
  if (!session) {
    await recordFailure(request, String(studentId ?? ""));
    return NextResponse.json(
      { error: "학번 또는 비밀번호가 올바르지 않습니다." },
      { status: 400 },
    );
  }
  await clearFailures(request, String(studentId));
  const { supabase, applicant, firstPublished, finalPublished, lockAt } = session;

  /*
   * 발표 전에는 합격 여부와 상관없이 똑같이 막는다.
   *
   * 예전에는 합격이면 시간 목록을, 아니면 403 을 줬다. 발표 전에 운영진이
   * 합격으로 표시해 두면 지원자가 이 응답만 보고 결과를 미리 알 수 있었다.
   */
  if (!firstPublished) {
    return NextResponse.json(
      { error: "아직 1차 결과가 발표되지 않았습니다." },
      { status: 403 },
    );
  }

  if (applicant.first_result !== "합격") {
    return NextResponse.json({ error: "면접 대상자가 아닙니다." }, { status: 403 });
  }

  const [{ data: slotData }, { data: takenData }] = await Promise.all([
    supabase
      .from("interview_slots")
      .select("id, slot_date, time_range, interval_label, capacity")
      .order("slot_date"),
    supabase.from("applicants").select("interview").not("interview", "is", null),
  ]);

  // 운영진이 등록한 하루치를 지원자가 고를 수 있는 칸으로 쪼갠다
  const times = expandAll((slotData ?? []) as SlotSource[]);
  const taken = (takenData ?? []) as { interview: string | null }[];
  const countOf = (t: SlotTime) => taken.filter((x) => x.interview === t.label).length;

  // ---- 목록만 달라는 요청 ----
  if (!slotId) {
    return NextResponse.json({
      current: applicant.interview,
      slots: times.map((t) => ({
        id: t.id,
        label: t.label,
        date: t.date,
        time: t.time,
        endTime: t.endTime,
        left: Math.max(0, t.capacity - countOf(t)),
        capacity: t.capacity,
      })),
    });
  }

  /*
   * 여기부터는 값을 저장하는 요청이다.
   *
   * 막는 것은 "이미 고른 시간을 바꾸는 것" 뿐이다. 아직 한 번도 안 고른
   * 사람은 언제든 고를 수 있어야 한다 — 연락이 늦게 닿은 사람까지 막으면
   * 면접 자체를 못 보게 된다.
   *
   * 화면에서도 같은 규칙으로 감추지만, 감추는 것과 막는 것은 다르다.
   * 요청을 직접 보내면 그만이므로 여기서 한 번 더 본다.
   */
  if (applicant.interview) {
    if (finalPublished) {
      return NextResponse.json(
        { error: "입력 기간이 지나 면접 시간 변경이 불가합니다." },
        { status: 403 },
      );
    }

    if (isInterviewLocked(lockAt)) {
      return NextResponse.json(
        { error: "면접 시간 변경이 마감됐습니다. 운영진에게 문의해 주세요." },
        { status: 403 },
      );
    }
  }

  // ---- 고른 시간으로 예약 ----
  const chosen = times.find((t) => t.id === slotId);
  if (!chosen) {
    return NextResponse.json({ error: "없는 시간대입니다." }, { status: 400 });
  }

  const label = chosen.label;
  // 이미 그 시간을 골라 둔 상태면 자리를 다시 세지 않는다
  if (applicant.interview !== label && countOf(chosen) >= chosen.capacity) {
    return NextResponse.json(
      { error: "방금 자리가 찼습니다. 다른 시간대를 골라주세요." },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("applicants")
    .update({ interview: label })
    .eq("id", applicant.id);

  if (error) {
    return NextResponse.json({ error: "저장 중 문제가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, interview: label });
}
