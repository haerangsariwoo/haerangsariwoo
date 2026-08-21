import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Panel.module.css";

export function Panel({
  title,
  count,
  desc,
  children,
}: {
  title: string;
  count?: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {count && <span className={styles.count}>{count}</span>}
      </div>
      {desc && <p className={styles.desc}>{desc}</p>}
      {children}
    </section>
  );
}

export type Tone = "blue" | "green" | "grey" | "warn" | "danger";

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={cn(styles.badge, styles[tone])}>{children}</span>;
}

export const ui = styles;
