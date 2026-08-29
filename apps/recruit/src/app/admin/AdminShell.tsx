"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { AdminTitle } from "./AdminTitle";
import type { ApplyPhase } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo/Logo";
import styles from "./layout.module.css";

interface StaffProfile {
  name: string;
  role: "운영진" | "관리자";
}

const PHASE_LABEL: Record<ApplyPhase, string> = {
  before: "접수 전",
  open: "접수 중",
  closed: "접수 마감",
};

export function AdminShell({
  children,
  profile,
  phase,
}: {
  children: ReactNode;
  profile: StaffProfile;
  phase: ApplyPhase;
}) {
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

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
            {PHASE_LABEL[phase]}
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
