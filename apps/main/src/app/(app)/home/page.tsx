import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import {
  albumTones,
  member,
  myTeam,
  nextActivity,
  notices,
  recruitingVolunteers,
  semesterStatus,
} from "@/lib/mock-data";
import styles from "./home.module.css";

const QUICK_MENU = [
  { label: "봉사 캘린더", icon: "/icons/quick-calendar.svg", href: "/calendar" },
  { label: "봉사 인증", icon: "/icons/quick-camera.svg", href: "/verify" },
  { label: "활동 기록", icon: "/icons/quick-clipboard.svg", href: "/my/records" },
  { label: "쪽지함", icon: "/icons/quick-envelope.svg", href: "/messages" },
];

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <span className={styles.heroMascot} role="img" aria-label="마스코트">
          🐬
        </span>
        <h1 className={styles.greeting}>안녕하세요, {member.name}님!</h1>
        <p className={styles.subGreeting}>오늘도 따뜻한 하루 보내세요.</p>

        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>총 봉사</p>
            <p className={styles.summaryValue}>{member.totalHours}시간</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>참여 활동</p>
            <p className={styles.summaryValue}>{member.totalActivities}회</p>
          </div>
        </div>
      </section>

      <section className={styles.duo}>
        <article className={cn(styles.card, styles.statusCard)}>
          <h2 className={styles.cardTitle}>이번 학기 현황</h2>
          <div className={styles.donutWrap}>
            <Image src="/icons/donut-92.svg" alt="" width={82} height={82} unoptimized />
            <span className={styles.donutValue}>{semesterStatus.attendanceRate}%</span>
          </div>
          <div className={styles.statusLines}>
            <p className={styles.statusPrimary}>
              봉사&nbsp;&nbsp;{semesterStatus.hoursDone} / {semesterStatus.hoursGoal}시간
            </p>
            <p className={styles.statusSecondary}>
              참여&nbsp;&nbsp;{semesterStatus.joinCount}회&nbsp;&nbsp;·&nbsp;&nbsp;출석{" "}
              {semesterStatus.attendanceRate}%
            </p>
          </div>
        </article>

        <article className={cn(styles.card, styles.nextCard)}>
          <div className={styles.nextHead}>
            <h2 className={styles.cardTitle}>다음 활동</h2>
            <span className={styles.ddayBadge}>D-{nextActivity.dday}</span>
          </div>
          <p className={styles.nextOrg}>{nextActivity.org}</p>
          <p className={styles.nextTitle}>{nextActivity.title}</p>
          <p className={styles.nextWhen}>{nextActivity.dateLabel}</p>
          <p className={styles.nextMeta}>{nextActivity.place}</p>
          <p className={styles.nextMeta}>{nextActivity.capacityLabel}</p>
        </article>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>모집 중인 봉사</h2>
          <Link href="/volunteer" className={styles.moreLink}>
            전체 보기&nbsp;&nbsp;›
          </Link>
        </div>
        <div className={styles.volunteerList}>
          {recruitingVolunteers.map((v) => (
            <VolunteerCard key={v.id} item={v} />
          ))}
        </div>
      </section>

      <section className={styles.duo}>
        <article className={cn(styles.card, styles.panel)}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>공지사항</h2>
            <Link href="/community" className={styles.panelMore}>
              전체&nbsp;&nbsp;›
            </Link>
          </div>
          <ul className={styles.noticeList}>
            {notices.map((n) => (
              <li key={n.id} className={styles.noticeItem}>
                <span className={cn(styles.noticeTag, n.tagTone === "urgent" && styles.urgent)}>
                  {n.tag}
                </span>
                <span className={styles.noticeText}>{n.title}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={cn(styles.card, styles.panel)}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>앨범</h2>
            <Link href="/community/album" className={styles.panelMore}>
              전체&nbsp;&nbsp;›
            </Link>
          </div>
          <div className={styles.albumGrid}>
            {albumTones.map((tone, i) => (
              <div key={i} className={cn(styles.photo, styles[tone])} />
            ))}
          </div>
        </article>
      </section>

      <Link href="/my/team" className={styles.teamCard}>
        <div>
          <p className={styles.teamLabel}>내 조</p>
          <p className={styles.teamName}>{myTeam.eventLabel}</p>
        </div>
        <span className={styles.teamMore}>조원 {myTeam.memberCount}명 보기&nbsp;&nbsp;›</span>
      </Link>

      <section>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>빠른 메뉴</h2>
        </div>
        <div className={styles.quickGrid}>
          {QUICK_MENU.map((item) => (
            <Link key={item.label} href={item.href} className={styles.quickItem}>
              <Image
                src={item.icon}
                alt=""
                width={24}
                height={24}
                className={styles.quickIcon}
                unoptimized
              />
              <span className={styles.quickLabel}>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
