import { redirect } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { ReadOnlyNotice } from "./ReadOnlyNotice";
import { SemesterProvider } from "./SemesterContext";
import "./admin-tokens.css";
import styles from "./layout.module.css";
import { createClient } from "@/lib/supabase/server";
import { isLocalAdminBypass, LOCAL_ADMIN_MEMBER } from "@/lib/local-admin";

export const metadata = {
  title: "운영진 관리자 / 해랑사리우",
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  let member: {
    name: string;
    cohort: string;
    role: "운영진" | "관리자";
    status: "approved";
  } | null;

  if (isLocalAdminBypass()) {
    member = {
      name: LOCAL_ADMIN_MEMBER.name,
      cohort: LOCAL_ADMIN_MEMBER.cohort,
      role: LOCAL_ADMIN_MEMBER.role,
      status: "approved",
    };
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");

    const { data } = await supabase
      .from("members")
      .select("name, cohort, role, status")
      .eq("id", user.id)
      .single();
    member = data;
  }

  const isStaff =
    !!member &&
    (member.role === "운영진" || member.role === "관리자") &&
    member.status === "approved";
  if (!member || !isStaff) redirect("/home");
  const staffMember = member;

  return (
    <SemesterProvider role={staffMember.role}>
      <AdminShell name={staffMember.name} cohort={staffMember.cohort} role={staffMember.role}>
        <p className={styles.mobileNote}>
          관리자 화면은 데스크톱에 최적화되어 있습니다. 표와 일괄 처리는
          PC에서 이용해 주세요.
        </p>
        <ReadOnlyNotice />
        {children}
      </AdminShell>
    </SemesterProvider>
  );
}
