import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ExternalVolunteer } from "@/lib/external/types";
import styles from "./ExternalCard.module.css";

const SOURCE_LABEL = { "1365": "1365", vms: "VMS" } as const;

/** 출처 표시용 공식 로고 */
const SOURCE_LOGO = {
  "1365": { src: "/portal-1365-icon.png", alt: "1365 자원봉사포털", w: 192, h: 192 },
  vms: { src: "/portal-vms-icon.png", alt: "VMS 사회복지자원봉사인증관리", w: 192, h: 192 },
} as const;

/** 2026-09-05 → 09.05 */
function short(d: string) {
  return d ? d.replace(/^\d{4}-/, "").replace("-", ".") : "";
}

function range(start: string, end: string) {
  if (!start && !end) return "";
  if (!end || start === end) return short(start || end);
  return `${short(start)} – ${short(end)}`;
}

/** 모집 마감까지 남은 일수 (오늘 기준) */
function daysLeft(recruitEnd: string) {
  if (!recruitEnd) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${recruitEnd}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

export function ExternalCard({ item }: { item: ExternalVolunteer }) {
  const full =
    item.capacity !== null && item.applied !== null && item.applied >= item.capacity;
  const left = daysLeft(item.recruitEnd);
  const closingSoon = left !== null && left <= 3;

  return (
    <a
      className={styles.card}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={cn(styles.thumb, item.source === "1365" ? styles.p1365 : styles.pvms)}>
        <Image
          className={styles.thumbLogo}
          src={SOURCE_LOGO[item.source].src}
          alt={SOURCE_LOGO[item.source].alt}
          width={SOURCE_LOGO[item.source].w}
          height={SOURCE_LOGO[item.source].h}
        />
      </span>

      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.org}>{item.org}</p>

        <dl className={styles.periods}>
          {item.recruitEnd && (
            <div className={styles.period}>
              <dt className={cn(styles.periodLabel, styles.recruit)}>모집</dt>
              <dd className={styles.periodValue}>
                {range(item.recruitStart, item.recruitEnd)}
                {left !== null && (
                  <span className={cn(styles.dday, closingSoon && styles.urgent)}>
                    {left === 0 ? "오늘 마감" : `D-${left}`}
                  </span>
                )}
              </dd>
            </div>
          )}
          <div className={styles.period}>
            <dt className={styles.periodLabel}>활동</dt>
            <dd className={styles.periodValue}>
              {range(item.startDate, item.endDate)}
              {item.time && ` · ${item.time}`}
            </dd>
          </div>
        </dl>

        <div className={styles.metaRow}>
          <span className={cn(styles.tag, styles.source)}>{SOURCE_LABEL[item.source]}</span>
          {item.category && <span className={styles.tag}>{item.category}</span>}
          {item.area && <span className={styles.tag}>{item.area}</span>}
          {full && <span className={cn(styles.tag, styles.full)}>정원 마감</span>}
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
