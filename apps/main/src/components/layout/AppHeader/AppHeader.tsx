"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/client";
import type { CurrentMember } from "@/lib/get-current-member";
import styles from "./AppHeader.module.css";
import { Logo } from "@/components/ui/Logo/Logo";

const MENU: { label: string; href: Route }[] = [
  { label: "봉사 캘린더", href: "/calendar" },
  { label: "봉사 인증", href: "/verify" },
  { label: "활동 기록", href: "/my/records" },
  { label: "내 조", href: "/my/team" },
  { label: "쪽지함 · 문의", href: "/messages" },
];

export function AppHeader({ profile }: { profile: CurrentMember }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isAdmin = profile.role === "운영진" || profile.role === "관리자";

  return (
    <>
      <header className={styles.header}>
        <Link href="/home" className={styles.brand} aria-label="홈으로">
          <Logo size={38} className={styles.mascot} priority />
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {open && (
        <>
          <button
            type="button"
            className={styles.overlay}
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          />
          {/* 드로어 안의 링크를 누르면 이동과 함께 닫는다 */}
          <aside
            className={styles.drawer}
            role="dialog"
            aria-label="전체 메뉴"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>전체 메뉴</span>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="닫기"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <Link href="/my" className={styles.profileRow}>
              <span className={styles.profileAvatar}>{profile.name.charAt(0)}</span>
              <span className={styles.profileText}>
                <span className={styles.profileName}>{profile.name}</span>
                <span className={styles.profileMeta}>
                  {profile.cohort} · {profile.role}
                </span>
              </span>
            </Link>

            <nav className={styles.menuList}>
              {MENU.map((m) => (
                <Link key={m.href} href={m.href} className={styles.menuItem}>
                  {m.label}
                  <span className={styles.chev}>›</span>
                </Link>
              ))}
            </nav>

            {isAdmin && (
              <Link href="/admin" className={styles.adminLink}>
                <span className={styles.adminIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M12 3l7.5 3v5.5c0 4.4-3 8.2-7.5 9.5-4.5-1.3-7.5-5.1-7.5-9.5V6z" />
                    <path d="M9.5 12l1.8 1.8 3.4-3.6" strokeLinecap="round" />
                  </svg>
                </span>
                <span className={styles.adminText}>
                  <span className={styles.adminLabel}>관리자 페이지</span>
                  <span className={styles.adminDesc}>봉사·회원·승인 관리 (운영진 전용)</span>
                </span>
              </Link>
            )}

            <button type="button" className={styles.logout} onClick={logout}>
              로그아웃
            </button>
          </aside>
        </>
      )}
    </>
  );
}
