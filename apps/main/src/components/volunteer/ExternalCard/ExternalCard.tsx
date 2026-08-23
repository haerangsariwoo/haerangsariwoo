import { cn } from "@/lib/cn";
import type { ExternalVolunteer } from "@/lib/external/types";
import styles from "./ExternalCard.module.css";

const SOURCE_LABEL = { "1365": "1365", vms: "VMS" } as const;

function dateRange(start: string, end: string) {
  const fmt = (d: string) => d.replace(/^\d{4}-/, "").replace("-", ".");
  if (!start) return "";
  if (!end || start === end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

export function ExternalCard({ item }: { item: ExternalVolunteer }) {
  const full =
    item.capacity !== null && item.applied !== null && item.applied >= item.capacity;

  return (
    <a
      className={styles.card}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={cn(styles.thumb, item.source === "1365" ? styles.p1365 : styles.pvms)}>
        {SOURCE_LABEL[item.source]}
      </span>

      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.org}>{item.org}</p>
        <p className={styles.date}>
          {dateRange(item.startDate, item.endDate)}
          {item.time && ` · ${item.time}`}
          {item.capacity !== null && (
            <>
              {" · "}
              {item.applied ?? 0} / {item.capacity}명
            </>
          )}
        </p>
        <div className={styles.metaRow}>
          <span className={cn(styles.tag, styles.source)}>{SOURCE_LABEL[item.source]}</span>
          {item.category && <span className={styles.tag}>{item.category}</span>}
          {item.area && <span className={styles.tag}>{item.area}</span>}
          {full && <span className={cn(styles.tag, styles.full)}>모집 마감</span>}
        </div>
      </div>

      <span className={styles.action}>
        원문
        <br />
        보기
      </span>
    </a>
  );
}
