import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "./AdminShell";
import { getRecruitSettings } from "@/lib/content-queries";
import { applyPhase } from "@/lib/schedule";

export const metadata = { title: "모집 관리자 · 해랑사리우" };

export default async function RecruitAdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("name, role, status")
    .eq("id", user.id)
    .single();

  const isStaff =
    !!member && (member.role === "운영진" || member.role === "관리자") && member.status === "approved";
  if (!isStaff) redirect("/login");

  // 배지는 코드에 박힌 기본값이 아니라 지금 설정을 보여줘야 한다
  const settings = await getRecruitSettings();

  return (
    <AdminShell
      profile={{ name: member.name, role: member.role as "운영진" | "관리자" }}
      phase={applyPhase(settings)}
    >
      {children}
    </AdminShell>
  );
}
