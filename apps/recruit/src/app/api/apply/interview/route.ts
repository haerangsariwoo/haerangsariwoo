import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  blockedMessage,
  checkAttempts,
  clearFailures,
  recordFailure,
} from "@/lib/apply-throttle";

/**
 * 1차 합격자가 면접 시간을 직접 고른다.
 *
 * 지원자는 로그인 계정이 없어 RLS 로 가릴 수가 없다. 그래서 학번 + 본인
 * 지정번호를 매번 같이 받아 확인한 뒤 service key 로 처리한다 (결과 조회와
 * 같은 방식). 남은 자리 계산과 저장은 반드시 서버에서 한다 — 화면에서
 * 막아 봐야 요청을 직접 보내면 그만이다.
 */

interface SlotRow {
  id: string;
  slot_date: string;
  time_range: string;
  interval_label: string;
  capacity: number;
}

/** "9.11 (목) 14:00–17:00" — 저장 형태. 운영진 화면은 날짜로 세므로 날짜가 앞에 온다 */
function slotLabel(s: SlotRow) {
  return `${s.slot_date} ${s.time_range}`;
}

async function verify(studentId: unknown, code: unknown) {
  if (typeof studentId !== "string" || typeof code !== "string") return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("applicants")
    .select("id, code, first_result, interview")
    .eq("student_id", studentId)
    .maybeSingle();

  if (!data || data.code !== code) return null;
  return { supabase, applicant: data as { id: string; first_result: string; interview: string | null } };
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
      { error: "학번 또는 본인 지정번호가 올바르지 않습니다." },
      { status: 400 },
    );
  }
  await clearFailures(request, String(studentId));
  const { supabase, applicant } = session;

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

  const slots = (slotData ?? []) as SlotRow[];
  const taken = (takenData ?? []) as { interview: string | null }[];
  const countOf = (s: SlotRow) =>
    taken.filter((t) => t.interview === slotLabel(s)).length;

  // ---- 목록만 달라는 요청 ----
  if (!slotId) {
    return NextResponse.json({
      current: applicant.interview,
      slots: slots.map((s) => ({
        id: s.id,
        label: slotLabel(s),
        date: s.slot_date,
        time: s.time_range,
        interval: s.interval_label,
        left: Math.max(0, s.capacity - countOf(s)),
        capacity: s.capacity,
      })),
    });
  }

  // ---- 고른 시간대로 예약 ----
  const chosen = slots.find((s) => s.id === slotId);
  if (!chosen) {
    return NextResponse.json({ error: "없는 시간대입니다." }, { status: 400 });
  }

  const label = slotLabel(chosen);
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
