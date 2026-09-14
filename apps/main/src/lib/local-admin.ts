import { defaultPhotoFocus } from "@/lib/photo-focus";

/**
 * 로컬 화면 확인용 관리자 프로필.
 * 자격 증명이 없는 화면 미리보기에서만 사용한다. 실제 DB와 혼용하지 않는다.
 */
export const LOCAL_ADMIN_MEMBER = {
  id: "local-admin",
  studentId: "0000000",
  name: "로컬 관리자",
  cohort: "로컬 테스트",
  track: "운영",
  role: "관리자" as const,
  photoUrl: null,
  photoFocus: defaultPhotoFocus,
};

export function isLocalAdminBypass() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.LOCAL_ADMIN_BYPASS === "1" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === "http://127.0.0.1:54321" &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "local-placeholder" &&
    !process.env.SUPABASE_SECRET_KEY &&
    !process.env.VERCEL
  );
}
