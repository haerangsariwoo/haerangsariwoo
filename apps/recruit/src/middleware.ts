import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const cookieOptions =
  process.env.NODE_ENV === "production"
    ? { domain: ".haerangsariwoo.site", sameSite: "lax" as const, secure: true }
    : undefined;

/**
 * 모집 사이트는 전부 공개다 — 관리자 화면(/admin)만 로그인이 필요하다.
 * /login 은 /admin 밖에 있어서 이 검사에 걸리지 않는다.
 * 실제 권한(운영진/관리자) 확인은 admin 레이아웃에서 서버로 한 번 더 한다 —
 * 여기서는 "로그인했는지"만 빠르게 본다.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff2?)$).*)"],
};
