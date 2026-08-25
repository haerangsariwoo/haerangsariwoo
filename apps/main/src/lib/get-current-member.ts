import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentMember {
  id: string;
  studentId: string;
  name: string;
  cohort: string;
  track: string;
  role: "부원" | "운영진" | "관리자";
}

/**
 * 로그인한 회원의 실제 프로필. 같은 요청 안에서 여러 번 불러도
 * (레이아웃 + 페이지 등) React cache 덕분에 조회는 한 번만 나간다.
 * 미승인·미로그인이면 null — middleware 가 이미 비로그인은 막아주지만
 * 승인 상태까지는 확인하지 않으므로 여기서 한 번 더 본다.
 */
export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("student_id, name, cohort, track, role, status")
    .eq("id", user.id)
    .single();

  if (!member || member.status !== "approved") return null;

  return {
    id: user.id,
    studentId: member.student_id,
    name: member.name,
    cohort: member.cohort,
    track: member.track,
    role: member.role,
  };
});
