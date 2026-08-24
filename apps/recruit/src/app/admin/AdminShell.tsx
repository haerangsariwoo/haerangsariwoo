"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNav } from "./AdminNav";
import { AdminTitle } from "./AdminTitle";
import { recruitConfig } from "@/lib/recruit-config";
import { Logo } from "@/components/ui/Logo/Logo";
import styles from "./layout.module.css";

/** 로그인 화면에서는 사이드바·상단바 없이 내용만 보여준다 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand} aria-label="관리자 홈으로">
          <Logo size={40} src="/logo-admin.avif" className={styles.mascot} priority />
          <span className={styles.adminTag}>ADMIN</span>
        </Link>

        <AdminNav />

        <div className={styles.profile}>
          <span className={styles.avatar}>재</span>
          <div>
            <p className={styles.profileName}>김재겸</p>
            <p className={styles.profileMeta}>운영진 · 관리자</p>
          </div>
        </div>

        <Link href="/" className={styles.backToSite}>
          ‹ 모집 사이트로
        </Link>
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
