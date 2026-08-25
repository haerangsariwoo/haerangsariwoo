import { createClient } from "@supabase/supabase-js";

/**
 * 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
 * publishable key 는 RLS(행 단위 보안)를 전제로 하므로, 테이블마다
 * 정책을 반드시 설정해야 한다 — 아직 정책이 없다면 관리자 데이터를
 * 여기로 조회하지 않는다.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
