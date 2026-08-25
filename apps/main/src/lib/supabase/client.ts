"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 컴포넌트에서 쓰는 Supabase 클라이언트.
 * 배포 환경에서는 쿠키 도메인을 .haerangsariwoo.site 로 둬서, 메인 앱
 * (app.haerangsariwoo.site)과 모집 앱(haerangsariwoo.site)이 로그인을
 * 공유한다. localhost 에서는 도메인을 지정하면 쿠키가 아예 안 먹혀서
 * 프로덕션에서만 적용한다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions:
        process.env.NODE_ENV === "production"
          ? { domain: ".haerangsariwoo.site", sameSite: "lax", secure: true }
          : undefined,
    },
  );
}
