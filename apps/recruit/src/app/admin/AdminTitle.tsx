"use client";

import { usePathname } from "next/navigation";
import { RECRUIT_NAV } from "./AdminNav";
import styles from "./layout.module.css";

export function AdminTitle() {
  const pathname = usePathname();
  const match = RECRUIT_NAV.find((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href),
  );

  return <h1 className={styles.pageTitle}>{match?.label ?? "모집 관리자"}</h1>;
}
