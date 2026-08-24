import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import {
  albumTones,
  member,
  myTeam,
  nextActivity,
  recruitingVolunteers,
  semesterStatus,
} from "@/lib/mock-data";
import { notices } from "@/lib/community";
import { verifyRequests } from "@/lib/verify";
import { homeCopy } from "@/lib/app-content";
import styles from "./home.module.css";
import { Mascot } from "@/components/ui/Logo/Mascot";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";

const pendingVerifyCount = verifyRequests.filter((r) => r.state === "대기").length;

/**
 * 바로가기. 활동 기록·쪽지함은 MY 메뉴에 이미 있어 뺐고,
 * 남긴 둘은 지금 상태를 함께 보여준다.
 */
const QUICK_MENU = [
  {
    label: "봉사 인증",
    icon: "/icons/quick-camera.svg",
    href: "/verify" as const,
    meta: "참여한 봉사의 증빙 제출",
    badge: pendingVerifyCount > 0 ? `검토 중 ${pendingVerifyCount}건` : null,
  },
  {
    label: "봉사 캘린더",
    icon: "/icons/quick-calendar.svg",
    href: "/calendar" as const,
    meta: "이번 달 일정 한눈에 보기",
    badge: null,
  },
];

/**
 * 홈은 세 묶음이다. 나 → 이번 학기에 할 일 → 내 자리.
 * 묶음 안은 선으로만 나누고, 묶음끼리만 여백으로 띄운다.
 */
export default function HomePage() {
  return (
    <Sheet>
      {/* ① 나 */}
      <SheetGroup>
        <section className={styles.hero}>
          <Mascot size={68} className={styles.heroMascot} priority />
          <h1 className={styles.greeting}>
            안녕하세요, {member.name}
            {homeCopy.greetingSuffix}
          </h1>
          <p className={styles.subGreeting}>{homeCopy.subGreeting}</p>

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
      </SheetGroup>

      {/* ② 이번 학기에 할 일 */}
      <SheetGroup>
        <section className={styles.duo}>
          <article className={styles.statusCard}>
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

          <article className={styles.nextCard}>
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
          <article>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>공지사항</h2>
              <Link href="/community" className={styles.panelMore}>
                전체&nbsp;&nbsp;›
              </Link>
            </div>
            <ul className={styles.noticeList}>
              {notices.map((n) => (
                <li key={n.id} className={styles.noticeItem}>
                  <Link href={`/community/notice/${n.id}`} className={styles.noticeLink}>
                    <span className={cn(styles.noticeTag, n.category === "필독" && styles.urgent)}>
                      {n.category}
                    </span>
                    <span className={styles.noticeText}>{n.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <article>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>앨범</h2>
              <Link href="/community?tab=앨범" className={styles.panelMore}>
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
      </SheetGroup>

      {/* ③ 내 자리 */}
      <SheetGroup>
        <Link href="/my/team" className={styles.teamCard}>
          <div>
            <p className={styles.teamLabel}>내 조</p>
            <p className={styles.teamName}>{myTeam.eventLabel}</p>
          </div>
          <span className={styles.teamMore}>조원 {myTeam.memberCount}명 보기&nbsp;&nbsp;›</span>
        </Link>

        <section>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>바로가기</h2>
          </div>
          <div className={styles.quickList}>
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
                <span className={styles.quickBody}>
                  <span className={styles.quickLabel}>{item.label}</span>
                  <span className={styles.quickMeta}>{item.meta}</span>
                </span>
                {item.badge && <span className={styles.quickBadge}>{item.badge}</span>}
                <span className={styles.quickChev} aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </section>
      </SheetGroup>
    </Sheet>
  );
}
