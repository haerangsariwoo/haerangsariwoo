"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import styles from "./layout.module.css";

const I = (d: string) => (
  <svg
    className={styles.navIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

export const ADMIN_NAV: { href: Route; label: string; icon: React.ReactNode }[] = [
  { href: "/admin", label: "대시보드", icon: I("M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z") },
  { href: "/admin/volunteers", label: "봉사활동 관리", icon: I("M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20Z") },
  { href: "/admin/activities", label: "활동 관리", icon: I("M4 6h16v14H4zM8 3v4M16 3v4M4 11h16") },
  { href: "/admin/applicants", label: "신청자 관리", icon: I("M4 6h16M4 12h16M4 18h10") },
  { href: "/admin/hours", label: "봉사시간 승인", icon: I("M5 12.5l4.5 4.5L19 7") },
  { href: "/admin/notices", label: "공지 알림", icon: I("M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9ZM10 18a2 2 0 0 0 4 0") },
  { href: "/admin/messages", label: "쪽지 보내기", icon: I("M3 6h18v12H3zM3 7l9 6 9-6") },
  { href: "/admin/members", label: "회원 관리", icon: I("M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11ZM3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16.5 10.6a3 3 0 0 0 0-5.8M18.5 20c0-2.6-1-4.3-2.8-5.1") },
  { href: "/admin/teams", label: "팀짜기", icon: I("M7 4v16M17 4v16M4 9h16M4 15h16") },
  { href: "/admin/board", label: "운영진 게시판", icon: I("M5 4h14v16H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4") },
  { href: "/admin/content", label: "콘텐츠 관리", icon: I("M4 5h16v11H4zM9 20h6M12 16v4") },
  { href: "/admin/partners", label: "협력기관", icon: I("M12 3l8 9-8 9-8-9z") },
  { href: "/admin/stats", label: "통계", icon: I("M6 18V10M12 18V6M18 18v-5M4 21h16") },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(styles.navItem, active && styles.active)}
            aria-current={active ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
