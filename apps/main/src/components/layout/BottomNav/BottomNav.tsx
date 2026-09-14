"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { BrandIcon } from "@/components/ui/BrandIcon/BrandIcon";
import styles from "./BottomNav.module.css";
const TABS = [
  { href: "/activities", label: "활동", icon: "calendar" },
  { href: "/volunteer", label: "봉사모집", icon: "heart" },
  { href: "/home", label: "홈", icon: "home" },
  { href: "/community", label: "커뮤니티", icon: "chat" },
  { href: "/my", label: "MY", icon: "wave" },
] as const;
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="주요 메뉴">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              styles.tab,
              active && styles.active,
              tab.href === "/home" && styles.home,
            )}
            data-tour={`nav-${tab.href.slice(1)}`}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.iconWell}>
              <BrandIcon
                name={tab.icon}
                size={tab.href === "/home" ? 48 : 33}
              />
            </span>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
