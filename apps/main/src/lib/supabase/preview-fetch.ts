/**
 * Fail fast only for the deliberately credential-free local preview.
 * Real local Supabase keys and every production build use the real transport.
 * No response pretends that a write succeeded.
 */
export function previewTransport() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== "local-placeholder" ||
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:54321"
  )
    return undefined;
  return {
    fetch: async () =>
      new Response(
        JSON.stringify({
          code: "LOCAL_PREVIEW",
          message:
            "로컬 화면 미리보기입니다. 저장하려면 Supabase 연결이 필요합니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
  };
}
