import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const cookieOptions =
  process.env.NODE_ENV === "production"
    ? { domain: ".haerangsariwoo.site", sameSite: "lax" as const, secure: true }
    : undefined;

/** 로그인 없이 들어갈 수 있는 경로 — 로그인(/)과 회원가입 */
const PUBLIC_PATHS = ["/signup"];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * 매 요청마다 세션을 갱신하고, 로그인 안 된 사용자가 회원 전용 화면에
 * 들어오면 로그인 페이지(/)로 돌려보낸다. 실제 권한(운영진/관리자)
 * 확인은 각 admin 레이아웃에서 한다 — 여기서는 "로그인했는지"만 본다.
 */
export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 승인 대기·반려 상태의 계정은 세션이 남아있어도 "/" 에서 그대로
  // 로그인 화면을 보게 둔다 — 여기서 무조건 /home 으로 보내면, /home
  // 이하의 각 페이지가 승인 여부를 다시 확인해 "/" 로 돌려보내면서
  // 무한 리다이렉트에 빠진다.
  if (user && pathname === "/") {
    const { data: member } = await supabase
      .from("members")
      .select("status")
      .eq("id", user.id)
      .single();

    if (member?.status === "approved") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff2?)$).*)"],
};
