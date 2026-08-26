import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** applicants 표에 자기 컬럼이 있는 문항들 — 나머지는 extra 로 간다 */
const CORE_FIELDS = ["name", "track", "phone", "motivation"] as const;

export async function POST(request: Request) {
  const body = await request.json();
  const { studentId, code, answers } = body ?? {};

  if (typeof studentId !== "string" || !/^\d{7}$/.test(studentId)) {
    return NextResponse.json({ error: "학번 7자리를 정확히 입력해 주세요." }, { status: 400 });
  }
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "숫자 6자리를 입력해 주세요." }, { status: 400 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "지원서 내용을 확인해 주세요." }, { status: 400 });
  }

  const values = answers as Record<string, unknown>;
  const text = (key: string) => (typeof values[key] === "string" ? (values[key] as string).trim() : "");

  // 필수 여부는 관리자가 문항마다 정하므로 여기서는 최소한 이름만 본다
  if (!text("name")) {
    return NextResponse.json({ error: "이름을(를) 입력해 주세요." }, { status: 400 });
  }

  const extra: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if ((CORE_FIELDS as readonly string[]).includes(key)) continue;
    if (typeof value === "string" && value.trim()) extra[key] = value.trim();
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("applicants").insert({
    student_id: studentId,
    code,
    name: text("name"),
    track: text("track"),
    phone: text("phone"),
    motivation: text("motivation"),
    extra,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 접수된 학번입니다." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "제출 중 문제가 발생했습니다. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
