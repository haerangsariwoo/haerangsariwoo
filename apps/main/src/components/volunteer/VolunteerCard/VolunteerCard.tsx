import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { VolunteerSummary } from "@/lib/mock-data";
import styles from "./VolunteerCard.module.css";

/** 출처별 기본 이미지 — 내부 봉사는 동아리 로고, 외부는 해당 포털 로고 */
const SOURCE_IMAGE: Record<VolunteerSummary["source"], string> = {
  internal: "/volunteer-default.png",
  "1365": "/portal-1365-icon.png",
  vms: "/portal-vms-icon.png",
};

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
        <span
          className={cn(
            styles.thumb,
            styles[item.thumbTone],
            isExternal && !item.imageUrl && styles.logoThumb,
          )}
        >
          <Image
            className={styles.thumbImage}
            src={item.imageUrl ?? SOURCE_IMAGE[item.source]}
            alt=""
            width={160}
            height={160}
          />
        </span>
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
