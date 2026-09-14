import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ExternalVolunteer } from "@/lib/external/types";
import { activityDate, recruitment } from "@/lib/external/presentation";
import styles from "./ExternalCard.module.css";

export function ExternalCard({
  item,
  today,
}: {
  item: ExternalVolunteer;
  today: string;
}) {
  const status = recruitment(item, today);
  const source = item.source === "1365" ? "1365" : "VMS";
  return (
    <a
      className={styles.card}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={styles.top}>
        <span className={styles.source}>
          <Image
            src={
              item.source === "1365"
                ? "/portal-1365-icon.png"
                : "/portal-vms-icon.png"
            }
            width={24}
            height={24}
            alt=""
          />
          {source}
          {item.category && <span>{item.category}</span>}
        </span>
        <span className={cn(styles.status, styles[status.tone])}>
          {status.label}
        </span>
      </div>
      <h3 className={styles.title}>{item.title}</h3>
      <dl className={styles.facts}>
        <div>
          <dt>언제</dt>
          <dd>
            {activityDate(item.startDate, item.endDate)}
            {item.time && <span className={styles.time}>{item.time}</span>}
          </dd>
        </div>
        <div>
          <dt>어디서</dt>
          <dd>{item.area || item.org || "원문에서 장소 확인"}</dd>
        </div>
      </dl>
      <p className={styles.org}>{item.org}</p>
      <div className={styles.bottom}>
        <span>
          {item.recruitEnd
            ? `${activityDate(item.recruitEnd, item.recruitEnd)}까지 신청`
            : "신청 기간은 원문에서 확인"}
        </span>
        <strong>
          {source}에서 보기{" "}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M5 3h8v8M13 3 3 13" />
          </svg>
          <span className={styles.srOnly}> (새 탭)</span>
        </strong>
      </div>
    </a>
  );
}
