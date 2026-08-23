import Link from "next/link";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { PushSettings } from "@/components/push/PushSettings/PushSettings";
import { InstallPrompt } from "@/components/push/InstallPrompt/InstallPrompt";
import { badges, hourStats, profile, records } from "@/lib/my";
import styles from "./my.module.css";

export const metadata = { title: "MY · 해랑사리우" };

const MENU = [
  { label: "봉사 인증하기", href: "/verify" as const },
  { label: "활동 확인서 · 증명자료", href: "/my/records" as const },
  { label: "쪽지함 · 문의", href: "/messages" as const },
];

export default function MyPage() {
  const upcoming = records.filter((r) => r.state !== "활동완료" && r.state !== "취소").slice(0, 3);

  return (
    <div className={styles.page}>
      <PageHeader title="MY" />

      <section className={styles.profileCard}>
        <span className={styles.avatar}>{profile.name.charAt(0)}</span>
        <div>
          <p className={styles.name}>{profile.name}</p>
          <p className={styles.profileMeta}>
            {profile.studentId} · {profile.cohort}
            <br />
            {profile.track}
          </p>
        </div>
        <span className={styles.roleTag}>{profile.role}</span>
      </section>

      <section className={styles.statRow}>
        {hourStats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>
              {s.value}
              <span className={styles.statCaption}>{s.caption}</span>
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>신청 내역</h2>
          <Link href="/my/records" className={styles.moreLink}>
            전체 보기&nbsp;&nbsp;›
          </Link>
        </div>
        <div className={styles.recordList}>
          {upcoming.map((r) => (
            <div key={r.id} className={styles.recordCard}>
              <div className={styles.recordBody}>
                <p className={styles.recordTitle}>{r.title}</p>
                <p className={styles.recordMeta}>{r.date}</p>
              </div>
              <span className={cn(styles.state, styles[r.state])}>{r.state}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>배지</h2>
          <span className={styles.moreLink}>
            {badges.filter((b) => b.earned).length} / {badges.length}
          </span>
        </div>
        <div className={styles.badgeGrid}>
          {badges.map((b) => (
            <div key={b.id} className={cn(styles.badge, !b.earned && styles.locked)}>
              <span className={styles.badgeDot} />
              <p className={styles.badgeLabel}>{b.label}</p>
              <p className={styles.badgeDesc}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>알림 설정</h2>
        </div>
        <InstallPrompt />
        <PushSettings />
      </section>

      <section className={styles.menuList}>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className={styles.menuItem}>
            {m.label}
            <span className={styles.chev}>›</span>
          </Link>
        ))}
      </section>

    </div>
  );
}
