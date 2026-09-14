import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 라우트 전용 — secret key 로 RLS 를 우회한다.
 * auth.users 삭제처럼 브라우저 클라이언트로는 할 수 없는 작업에만 쓴다.
 */
export function createAdminClient() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "local-placeholder" ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    throw new Error("관리자 DB 연결이 설정되지 않았습니다. 화면 미리보기에서는 서버 키를 사용하지 않습니다.");
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}
