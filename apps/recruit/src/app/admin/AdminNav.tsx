"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import styles from "./layout.module.css";

export const RECRUIT_NAV: { href: Route; label: string; icon: string }[] = [
  { href: "/admin", label: "대시보드", icon: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" },
  { href: "/admin/applicants", label: "지원자 관리", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/review", label: "심사", icon: "M5 12.5l4.5 4.5L19 7" },
  { href: "/admin/interviews", label: "면접 일정", icon: "M3 4.5h18v16H3zM3 9h18M8 2.5v4M16 2.5v4" },
  { href: "/admin/content", label: "랜딩 콘텐츠", icon: "M5 4h14v16H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4" },
  { href: "/admin/settings", label: "모집 설정", icon: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.5l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.5 8.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 11h.1a2 2 0 1 1 0 4H21Z" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {RECRUIT_NAV.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(styles.navItem, active && styles.active)}
            aria-current={active ? "page" : undefined}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
