import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const cookieOptions =
  process.env.NODE_ENV === "production"
    ? { domain: ".haerangsariwoo.site", sameSite: "lax" as const, secure: true }
    : undefined;

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
            // 서버 컴포넌트에서 호출되면 쓰기가 막혀 있다 — middleware 가 갱신
          }
        },
      },
    },
  );
}
