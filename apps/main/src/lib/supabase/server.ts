import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const cookieOptions =
  process.env.NODE_ENV === "production"
    ? { domain: ".haerangsariwoo.site", sameSite: "lax" as const, secure: true }
    : undefined;

/** 서버 컴포넌트 · 라우트 핸들러에서 쓰는 Supabase 클라이언트 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 쓰기가 막혀 있다 — middleware 가
            // 매 요청마다 세션을 갱신하므로 여기서는 무시해도 된다.
          }
        },
      },
    },
  );
}
