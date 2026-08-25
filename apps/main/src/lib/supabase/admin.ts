import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 라우트 전용 — secret key 로 RLS 를 우회한다.
 * auth.users 삭제처럼 브라우저 클라이언트로는 할 수 없는 작업에만 쓴다.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}
