import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 로그인 없는 공개 지원 흐름(제출·조회)은 secret key 로 서버에서만 처리한다.
 * applicants 테이블은 RLS 로 anon/authenticated 쓰기를 막아뒀으므로,
 * 이 클라이언트를 API 라우트 밖에서 쓰면 안 된다.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}
