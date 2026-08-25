import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 회원 삭제는 관리자만 — 학기 변경과 같은 급으로 위험도가 높은 작업이라
 * (auth.users 계정까지 같이 지운다) 브라우저 클라이언트/RLS 가 아니라
 * 여기서 호출자의 role 을 직접 확인한 뒤 secret key 로 처리한다.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const isAdmin = caller?.role === "관리자" && caller?.status === "approved";
  if (!isAdmin) {
    return NextResponse.json({ error: "관리자만 회원을 삭제할 수 있습니다." }, { status: 403 });
  }

  if (id === user.id) {
    return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin.from("members").delete().eq("id", id);
  if (dbError) {
    return NextResponse.json({ error: "삭제 중 문제가 발생했습니다." }, { status: 500 });
  }

  // members 행이 사라져도 로그인 계정(auth.users)이 남으면 같은 학번으로
  // 재가입이 막히니 계정도 함께 지운다.
  await admin.auth.admin.deleteUser(id);

  return NextResponse.json({ ok: true });
}
