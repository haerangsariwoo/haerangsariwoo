"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "./AdminNav";
import { createClient } from "@/lib/supabase/client";
import { SEMESTERS, useSemester } from "./SemesterContext";
import { cn } from "@/lib/cn";
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
  const { semester, setSemester, readOnly, canChangeSemester } = useSemester();

  // 상단 배지는 아직 검토하지 않은 증빙 건수다 — 실제 표를 세어 보여준다
  const supabase = useMemo(() => createClient(), []);
  const [pendingHours, setPendingHours] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("proof_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "대기")
      .then(({ count }) => {
        if (!cancelled) setPendingHours(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <header className={styles.topbar}>
      <h1 className={styles.pageTitle}>{title}</h1>

      <select
        className={cn(styles.semesterSelect, readOnly && styles.semesterReadOnly)}
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
        aria-label="학기 선택"
        disabled={!canChangeSemester}
        title={!canChangeSemester ? "학기 전환은 관리자만 할 수 있습니다." : undefined}
      >
        {SEMESTERS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {readOnly && (
        <span className={styles.readOnlyTag} title="지난 학기 기록 — 읽기 전용">
          읽기 전용
        </span>
      )}

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
