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
    <Link href={`/volunteer/${item.id}`} className={styles.card} aria-label={item.title}>
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

      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.meta}>{item.dateLabel}</p>
        <div className={styles.tagRow}>
          <span className={styles.tag}>{item.category}</span>
          <span className={styles.tag}>{SOURCE_LABEL[item.source]}</span>
          {item.status === "closing" && <span className={cn(styles.tag, styles.closing)}>마감임박</span>}
          {closed && <span className={cn(styles.tag, styles.closed)}>마감</span>}
        </div>
      </div>
    </Link>
  );
}
