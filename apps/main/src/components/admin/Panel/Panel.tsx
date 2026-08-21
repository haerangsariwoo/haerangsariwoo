import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/cn";
import styles from "./Panel.module.css";

interface PanelProps {
  title: string;
  count?: string;
  desc?: string;
  action?: { label: string; href: Route };
  className?: string;
  children: ReactNode;
}

export function Panel({ title, count, desc, action, className, children }: PanelProps) {
  return (
    <section className={cn(styles.panel, className)}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {count && <span className={styles.count}>{count}</span>}
        {action && (
          <Link href={action.href} className={styles.action}>
            {action.label}&nbsp;&nbsp;›
          </Link>
        )}
      </div>
      {desc && <p className={styles.desc}>{desc}</p>}
      {children}
    </section>
  );
}
