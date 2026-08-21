import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import { findVolunteer, volunteers } from "@/lib/mock-data";
import styles from "./detail.module.css";

export function generateStaticParams() {
  return volunteers.map((v) => ({ id: v.id }));
}

const STATUS_LABEL = {
  open: "모집 중",
  closing: "마감 임박",
  waitlist: "대기 접수",
  closed: "모집 마감",
} as const;

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4.5" width="18" height="16" rx="3" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
);

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.5l3.5 2" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c0-3.1 2.7-5.2 6-5.2s6 2.1 6 5.2M16 11.2A3 3 0 0 0 16 5.4M18 19c0-2.4-1-4-2.6-4.8" />
  </svg>
);

export default async function VolunteerDetailPage({ params }: PageProps<"/volunteer/[id]">) {
  const { id } = await params;
  const item = findVolunteer(id);
  if (!item) notFound();

  const isExternal = item.source !== "internal";
  const closed = item.status === "closed";
  const pct = Math.min(100, Math.round((item.applied / item.capacity) * 100));

  return (
    <div className={styles.page}>
      <Link href="/volunteer" className={styles.backLink}>
        ‹ 봉사 모집
      </Link>

      <div className={cn(styles.hero, styles[item.thumbTone])} />

      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>{item.title}</h1>
          <p className={styles.org}>{item.org}</p>
        </div>
        <span
          className={cn(
            styles.statusBadge,
            styles[item.status === "waitlist" ? "open" : item.status],
          )}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      <section className={styles.factCard}>
        <div className={styles.factRow}>
          <span className={styles.factIcon}>
            <CalendarIcon />
          </span>
          <div>
            <p className={styles.factLabel}>일시</p>
            <p className={styles.factValue}>
              {item.dateLabel.split(" · ")[0]} · {item.timeLabel}
            </p>
          </div>
        </div>

        <div className={styles.factRow}>
          <span className={styles.factIcon}>
            <PinIcon />
          </span>
          <div>
            <p className={styles.factLabel}>장소</p>
            <p className={styles.factValue}>{item.place}</p>
          </div>
        </div>

        <div className={styles.factRow}>
          <span className={styles.factIcon}>
            <ClockIcon />
          </span>
          <div>
            <p className={styles.factLabel}>인정시간</p>
            <p className={styles.factValue}>{item.creditHours}시간</p>
          </div>
        </div>

        <div className={styles.factRow}>
          <span className={styles.factIcon}>
            <UsersIcon />
          </span>
          <div style={{ flex: 1 }}>
            <p className={styles.factLabel}>모집 현황</p>
            <p className={styles.factValue}>
              {item.applied} / {item.capacity}명
            </p>
            <div className={styles.capacityBar}>
              <div className={styles.capacityFill} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>활동 소개</h2>
        <p className={styles.body}>{item.intro}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>담당 업무</h2>
        <ul className={styles.list}>
          {item.duties.map((d) => (
            <li key={d} className={styles.listItem}>
              <span className={styles.bullet}>·</span>
              {d}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>준비물</h2>
        <ul className={styles.list}>
          {item.supplies.map((s) => (
            <li key={s} className={styles.listItem}>
              <span className={styles.bullet}>·</span>
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>주의사항</h2>
        <ul className={styles.list}>
          {item.cautions.map((c) => (
            <li key={c} className={styles.listItem}>
              <span className={styles.bullet}>·</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>문의</h2>
        <p className={styles.body}>{item.manager}</p>
      </section>

      {isExternal && (
        <p className={styles.externalNote}>
          이 봉사는 {item.source === "1365" ? "1365 자원봉사포털" : "VMS"}에 올라온 활동입니다.
          신청은 원본 사이트에서 진행해 주세요.
        </p>
      )}

      <div className={styles.footer}>
        {closed ? (
          <Button variant="outline" size="lg" fullWidth disabled>
            모집이 마감되었어요
          </Button>
        ) : isExternal ? (
          <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg" fullWidth>
              {item.source === "1365" ? "1365에서 신청하기" : "VMS에서 신청하기"}
            </Button>
          </a>
        ) : (
          <Button variant="primary" size="lg" fullWidth>
            신청하기
          </Button>
        )}
      </div>
    </div>
  );
}
