import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInterviewLocked } from "@/lib/interview-lock";
import {
  blockedMessage,
  checkAttempts,
  clearFailures,
  recordFailure,
} from "@/lib/apply-throttle";

export async function POST(request: Request) {
  const { studentId, code } = await request.json();

  if (typeof studentId !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "학번과 본인 지정번호를 입력해 주세요." }, { status: 400 });
  }

  const gate = await checkAttempts(request, studentId);
  if (gate.blocked) {
    return NextResponse.json({ error: blockedMessage(gate) }, { status: 429 });
  }

  const supabase = createAdminClient();

  const [{ data: applicant }, { data: settings }] = await Promise.all([
    supabase
      .from("applicants")
      .select("name, code, first_result, interview, final_result")
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("recruit_settings")
      .select("first_published, final_published, interview_lock_at")
      .eq("id", 1)
      .single(),
  ]);

  if (!applicant || applicant.code !== code) {
    await recordFailure(request, studentId);
    return NextResponse.json({ error: "학번 또는 본인 지정번호가 올바르지 않습니다." }, { status: 400 });
  }

  await clearFailures(request, studentId);

  const firstPublished = settings?.first_published ?? false;
  const finalPublished = settings?.final_published ?? false;

  /*
   * 발표 전에는 결과를 보내지 않는다.
   *
   * 예전에는 실제 결과를 그대로 담아 보내고 화면에서만 가렸다. 개발자도구나
   * 주소 창으로 응답을 그냥 볼 수 있으니 가린 것이 아니었다.
   *
   * 면접 시간도 마찬가지다 — 1차 합격자에게만 생기는 값이라, 발표 전에
   * 내려보내면 그 자체로 합격을 알려주는 셈이다.
   */
  return NextResponse.json({
    name: applicant.name,
    firstResult: firstPublished ? applicant.first_result : "대기",
    finalResult: finalPublished ? applicant.final_result : "대기",
    interview: firstPublished ? applicant.interview : null,
    firstPublished,
    finalPublished,
    // 잠겼는지는 서버가 판단한다 — 기기 시계가 틀린 사람이 있다
    interviewLocked: isInterviewLocked(settings?.interview_lock_at),
  });
}
