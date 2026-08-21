import Link from "next/link";
import { cn } from "@/lib/cn";
import type { VolunteerSummary } from "@/lib/mock-data";
import styles from "./VolunteerCard.module.css";

const SOURCE_LABEL: Record<VolunteerSummary["source"], string> = {
  internal: "내부",
  "1365": "1365",
  vms: "VMS",
};

export function VolunteerCard({ item }: { item: VolunteerSummary }) {
  const isExternal = item.source !== "internal";
  const closed = item.status === "closed";

  return (
    <article className={styles.card}>
      <Link href={`/volunteer/${item.id}`} className={styles.thumbLink} aria-label={item.title}>
        <span className={cn(styles.thumb, styles[item.thumbTone])} />
      </Link>

      <div className={styles.body}>
        <Link href={`/volunteer/${item.id}`}>
          <h3 className={styles.title}>{item.title}</h3>
        </Link>
        <p className={styles.meta}>{item.dateLabel}</p>
        <div className={styles.tagRow}>
          <span className={styles.tag}>{item.category}</span>
          <span className={styles.tag}>{SOURCE_LABEL[item.source]}</span>
          {item.status === "closing" && <span className={cn(styles.tag, styles.closing)}>마감임박</span>}
        </div>
      </div>

      {closed ? (
        <span className={cn(styles.action, styles.closed)}>마감</span>
      ) : isExternal ? (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.action}
        >
          원문 보기
        </a>
      ) : (
        <Link href={`/volunteer/${item.id}`} className={styles.action}>
          신청하기
        </Link>
      )}
    </article>
  );
}
