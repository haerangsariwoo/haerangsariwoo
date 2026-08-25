import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "./AdminShell";

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

  return (
    <AdminShell profile={{ name: member.name, role: member.role as "운영진" | "관리자" }}>
      {children}
    </AdminShell>
  );
}
