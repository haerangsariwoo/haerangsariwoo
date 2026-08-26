import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  blockedMessage,
  checkAttempts,
  clearFailures,
  recordFailure,
} from "@/lib/apply-throttle";

/**
 * 1단계(지원자 확인)에서 학번+본인 지정번호를 받아 분기한다.
 * - 기존 지원이 없으면: 새로 지원하는 사람 → 폼으로 진행
 * - 기존 지원이 있고 번호가 맞으면: 이미 지원한 사람 → 현황 페이지로
 * - 기존 지원이 있는데 번호가 틀리면: 에러
 */
export async function POST(request: Request) {
  const { studentId, code } = await request.json();

  if (typeof studentId !== "string" || !/^\d{7}$/.test(studentId)) {
    return NextResponse.json({ error: "학번 7자리를 정확히 입력해 주세요." }, { status: 400 });
  }
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "숫자 6자리를 입력해 주세요." }, { status: 400 });
  }

  const gate = await checkAttempts(request, studentId);
  if (gate.blocked) {
    return NextResponse.json({ error: blockedMessage(gate) }, { status: 429 });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("applicants")
    .select("code")
    .eq("student_id", studentId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ exists: false });
  }

  if (data.code !== code) {
    await recordFailure(request, studentId);
    return NextResponse.json(
      { error: "이미 접수된 학번입니다. 본인 지정번호를 다시 확인해 주세요." },
      { status: 400 },
    );
  }

  await clearFailures(request, studentId);
  return NextResponse.json({ exists: true });
}
