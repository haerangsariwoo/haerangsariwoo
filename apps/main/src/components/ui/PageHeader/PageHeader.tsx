import Link from "next/link";
import type { Route } from "next";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  meta?: string;
  back?: { href: Route; label: string };
}

export function PageHeader({ title, meta, back }: PageHeaderProps) {
  return (
    <div className={styles.wrap}>
      {back && (
        <Link href={back.href} className={styles.backLink}>
          ‹ {back.label}
        </Link>
      )}
      <div className={styles.row}>
        <h1 className={styles.title}>{title}</h1>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
    </div>
  );
}
