import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { studentId, code, name, track, phone, motivation } = body ?? {};

  if (typeof studentId !== "string" || !/^\d{7}$/.test(studentId)) {
    return NextResponse.json({ error: "학번 7자리를 정확히 입력해 주세요." }, { status: 400 });
  }
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "숫자 6자리를 입력해 주세요." }, { status: 400 });
  }
  for (const [field, label] of [
    [name, "이름"],
    [track, "소속"],
    [phone, "연락처"],
    [motivation, "지원 동기"],
  ] as const) {
    if (typeof field !== "string" || !field.trim()) {
      return NextResponse.json({ error: `${label}을(를) 입력해 주세요.` }, { status: 400 });
    }
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("applicants").insert({
    student_id: studentId,
    code,
    name: name.trim(),
    track: track.trim(),
    phone: phone.trim(),
    motivation: motivation.trim(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 접수된 학번입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: "제출 중 문제가 발생했습니다. 다시 시도해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
