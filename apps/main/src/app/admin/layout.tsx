import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "./AdminNav";
import { AdminTopbar } from "./AdminTopbar";
import { ReadOnlyNotice } from "./ReadOnlyNotice";
import { SemesterProvider } from "./SemesterContext";
import "./admin-tokens.css";
import styles from "./layout.module.css";
import { Logo } from "@/components/ui/Logo/Logo";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "운영진 관리자 · 해랑사리우",
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: member } = await supabase
    .from("members")
    .select("name, cohort, role, status")
    .eq("id", user.id)
    .single();

  const isStaff =
    !!member &&
    (member.role === "운영진" || member.role === "관리자") &&
    member.status === "approved";
  if (!isStaff) redirect("/home");

  return (
    <SemesterProvider role={member.role as "운영진" | "관리자"}>
      <div className={`adminScope ${styles.shell}`}>
        <aside className={styles.sidebar}>
          <Link href="/admin" className={styles.brand} aria-label="관리자 홈으로">
            <Logo size={40} src="/logo-admin.avif" className={styles.mascot} priority />
            <span className={styles.adminTag}>ADMIN</span>
          </Link>

          <AdminNav />

          <div className={styles.profile}>
            <span className={styles.avatar}>{member.name.charAt(0)}</span>
            <div>
              <p className={styles.profileName}>
                {member.name} {member.role}
              </p>
              <p className={styles.profileMeta}>
                {member.cohort} · {member.role}
              </p>
            </div>
          </div>

          <Link href="/home" className={styles.backToApp}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 6l-6 6 6 6" />
            </svg>
            회원 앱으로 돌아가기
          </Link>
        </aside>

        <div className={styles.main}>
          <AdminTopbar />
          <div className={styles.content}>
            <p className={styles.mobileNote}>
              관리자 화면은 데스크톱에 최적화되어 있습니다. 표와 일괄 처리는 PC에서 이용해 주세요.
            </p>
            <ReadOnlyNotice />
            {children}
          </div>
        </div>
      </div>
    </SemesterProvider>
  );
}
