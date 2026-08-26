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

/**
 * 홈의 반쪽 칸처럼 폭이 좁은 자리에서는 compact 로 쓴다.
 * 사진은 남기되 작게 줄이고, 두 줄이던 태그는 분야 하나만 남긴다 —
 * 좁은 칸에서 태그가 줄바꿈되면 카드 높이가 들쭉날쭉해진다.
 */
export function VolunteerCard({
  item,
  compact = false,
}: {
  item: VolunteerSummary;
  compact?: boolean;
}) {
  const isExternal = item.source !== "internal";
  const closed = item.status === "closed";

  return (
    <Link
      href={`/volunteer/${item.id}`}
      className={cn(styles.card, compact && styles.compact)}
      aria-label={item.title}
    >
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
          {!compact && <span className={styles.tag}>{SOURCE_LABEL[item.source]}</span>}
          {item.status === "closing" && <span className={cn(styles.tag, styles.closing)}>마감임박</span>}
          {closed && <span className={cn(styles.tag, styles.closed)}>마감</span>}
        </div>
      </div>
    </Link>
  );
}
