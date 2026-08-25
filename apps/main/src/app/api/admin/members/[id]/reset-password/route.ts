import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_PASSWORD = "qwer1234";

/** 비밀번호 초기화는 운영진/관리자 누구나 — 실제 값은 운영진도 알 수 없고, 초기화만 가능하다. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("members")
    .select("role, status")
    .eq("id", user.id)
    .single();

  const isStaff =
    !!caller && (caller.role === "운영진" || caller.role === "관리자") && caller.status === "approved";
  if (!isStaff) {
    return NextResponse.json({ error: "운영진만 비밀번호를 초기화할 수 있습니다." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password: DEFAULT_PASSWORD });
  if (error) {
    return NextResponse.json({ error: "초기화 중 문제가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, password: DEFAULT_PASSWORD });
}
