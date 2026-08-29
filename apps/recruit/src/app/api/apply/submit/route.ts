import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyPhase } from "@/lib/schedule";

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

  /*
   * 접수 기간인지 여기서도 본다.
   *
   * 지금까지는 랜딩에서 "지원하기" 버튼을 감추는 것이 전부였다. 주소를
   * 직접 치면 폼이 열리고 제출도 그대로 통과해서, 접수를 닫아둔 동안에도
   * 지원서가 들어왔다. 감추는 것과 막는 것은 다르다.
   */
  const { data: settings } = await supabase
    .from("recruit_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const phase = applyPhase({
    applicationsOpen: settings?.applications_open ?? false,
    applyStartAt: settings?.apply_start_at ?? null,
    applyEndAt: settings?.apply_end_at ?? null,
  });

  if (phase !== "open") {
    return NextResponse.json(
      {
        error:
          phase === "before"
            ? "아직 지원서 접수가 시작되지 않았습니다."
            : "지원서 접수가 마감됐습니다.",
      },
      { status: 403 },
    );
  }

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
