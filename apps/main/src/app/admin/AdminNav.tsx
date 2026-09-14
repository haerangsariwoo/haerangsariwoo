"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import styles from "./layout.module.css";

export const ADMIN_NAV: { href: Route; label: string }[] = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/activities", label: "활동 관리" },
  { href: "/admin/messages", label: "메신저" },
  { href: "/admin/teams", label: "팀짜기" },
  { href: "/admin/board", label: "운영진 게시판" },
  { href: "/admin/content", label: "콘텐츠 관리" },
  { href: "/admin/partners", label: "협력기관" },
  { href: "/admin/stats", label: "통계" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="관리자 메뉴">
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(styles.navItem, active && styles.active)}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
