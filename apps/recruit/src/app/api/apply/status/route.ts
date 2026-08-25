import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { studentId, code } = await request.json();

  if (typeof studentId !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "학번과 본인 지정번호를 입력해 주세요." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const [{ data: applicant }, { data: settings }] = await Promise.all([
    supabase
      .from("applicants")
      .select("name, code, first_result, interview, final_result")
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase.from("recruit_settings").select("first_published, final_published").eq("id", 1).single(),
  ]);

  if (!applicant || applicant.code !== code) {
    return NextResponse.json({ error: "학번 또는 본인 지정번호가 올바르지 않습니다." }, { status: 400 });
  }

  return NextResponse.json({
    name: applicant.name,
    firstResult: applicant.first_result,
    finalResult: applicant.final_result,
    interview: applicant.interview,
    firstPublished: settings?.first_published ?? false,
    finalPublished: settings?.final_published ?? false,
  });
}
