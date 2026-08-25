"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AdminNav } from "./AdminNav";
import { AdminTitle } from "./AdminTitle";
import { recruitConfig } from "@/lib/recruit-config";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo/Logo";
import styles from "./layout.module.css";

interface StaffProfile {
  name: string;
  role: "운영진" | "관리자";
}

/** 로그인 화면에서는 사이드바·상단바 없이 내용만 보여준다 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [checked, setChecked] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data: member } = await supabase
        .from("members")
        .select("name, role, status")
        .eq("id", user.id)
        .single();

      const isStaff =
        !!member &&
        (member.role === "운영진" || member.role === "관리자") &&
        member.status === "approved";

      if (cancelled) return;

      if (!isStaff) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setProfile({ name: member.name, role: member.role as "운영진" | "관리자" });
      setChecked(true);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [isLoginPage, supabase, router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (isLoginPage) return <>{children}</>;
  if (!checked || !profile) return null;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand} aria-label="관리자 홈으로">
          <Logo size={40} src="/logo-admin.avif" className={styles.mascot} priority />
          <span className={styles.adminTag}>ADMIN</span>
        </Link>

        <AdminNav />

        <div className={styles.profile}>
          <span className={styles.avatar}>{profile.name.charAt(0)}</span>
          <div>
            <p className={styles.profileName}>{profile.name}</p>
            <p className={styles.profileMeta}>{profile.role}</p>
          </div>
        </div>

        <Link href="/" className={styles.backToSite}>
          ‹ 모집 사이트로
        </Link>
        <button type="button" className={styles.logout} onClick={logout}>
          로그아웃
        </button>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <AdminTitle />
          <span className={styles.statusPill}>
            {recruitConfig.applicationsOpen ? "접수 중" : "접수 중지"}
          </span>
        </header>

        <div className={styles.content}>
          <p className={styles.mobileNote}>
            모집 관리자는 데스크톱에 최적화되어 있습니다. 명단·심사는 PC에서 이용해 주세요.
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
