"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "./AdminNav";
import { hourRequests } from "@/lib/admin-data";
import styles from "./layout.module.css";

const TITLES: Record<string, string> = {
  "/admin": "운영진 대시보드",
};

export function AdminTopbar() {
  const pathname = usePathname();
  const match = ADMIN_NAV.find((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href),
  );
  const title = TITLES[pathname] ?? match?.label ?? "운영진";
  const pendingHours = hourRequests.filter((h) => h.state === "대기").length;

  return (
    <header className={styles.topbar}>
      <h1 className={styles.pageTitle}>{title}</h1>

      <select className={styles.semesterSelect} defaultValue="2026-2" aria-label="학기 선택">
        <option value="2026-2">2026-2학기</option>
        <option value="2026-1">2026-1학기</option>
        <option value="2025-2">2025-2학기</option>
      </select>

      {/* 처리할 일이 있는 곳으로 보낸다 */}
      <Link href="/admin/hours" className={styles.iconButton} aria-label={`승인 대기 ${pendingHours}건`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9ZM10 18a2 2 0 0 0 4 0" />
        </svg>
        {pendingHours > 0 && <span className={styles.iconDot} />}
      </Link>
    </header>
  );
}
