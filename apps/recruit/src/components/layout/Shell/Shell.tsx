import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Logo } from "@/components/ui/Logo/Logo";
import styles from "./Shell.module.css";

interface ShellProps {
  title?: string;
  back?: Route;
  step?: { current: number; total: number };
  children: ReactNode;
}

export function Shell({ title, back, step, children }: ShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {title && (
          <>
            <header className={styles.header}>
              {back && (
                <Link href={back} className={styles.back} aria-label="뒤로">
                  ‹
                </Link>
              )}
              <span className={styles.title}>{title}</span>
              <Link href="/" className={styles.homeLogo} aria-label="처음으로">
                <Logo size={24} />
              </Link>
              {step && (
                <span className={styles.step}>
                  {step.current} / {step.total}
                </span>
              )}
            </header>
            {step && (
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(step.current / step.total) * 100}%` }}
                />
              </div>
            )}
          </>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}
