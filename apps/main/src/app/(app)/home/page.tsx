import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { cn } from "@/lib/cn";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import { getNotices } from "@/lib/notices";
import { getMyProofSubmissions } from "@/lib/proof";
import { getMyTeam } from "@/lib/teams";
import { getMyStats } from "@/lib/my-stats";
import { getAppContent } from "@/lib/app-content-queries";
import { getCurrentMember } from "@/lib/get-current-member";
import { getInternalActivities } from "@/lib/volunteers";
import { getExternalVolunteers } from "@/lib/external";
import styles from "./home.module.css";
import { AlbumPreview } from "./AlbumPreview";
import { HomeInstallPopup } from "./HomeInstallPopup";
import { Mascot } from "@/components/ui/Logo/Mascot";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";

/**
 * 홈은 세 묶음이다. 나 → 이번 학기에 할 일 → 내 자리.
 * 묶음 안은 선으로만 나누고, 묶음끼리만 여백으로 띄운다.
 */
export default async function HomePage() {
  const profile = await getCurrentMember();
  if (!profile) redirect("/");

  /*
   * 외부 포털 목록을 미리 데워둔다.
   *
   * 부원은 거의 홈을 거쳐 봉사 모집으로 간다. 그때 캐시가 비어 있으면
   * 포털 두 곳을 읽는 십여 초를 그 사람이 통째로 기다린다. 홈 응답을 보낸
   * 뒤에 미리 채워두면 정작 누를 때는 이미 준비돼 있다.
   *
   * 홈이 느려지지는 않는다 — 응답을 보낸 다음에 도는 일이다. 포털에
   * 가는 부담도 늘지 않는다. 캐시가 신선하면 표만 한 번 읽고 끝나서,
   * 포털을 실제로 읽는 것은 여전히 한 시간에 한 번이다.
   */
  after(() => getExternalVolunteers());

  const [internalActivities, proofSubmissions, notices, myTeam, stats, content] =
    await Promise.all([
      getInternalActivities(),
      getMyProofSubmissions(),
      getNotices(),
      getMyTeam(),
      getMyStats(),
      getAppContent(),
    ]);
  const recruitingVolunteers = internalActivities.filter((v) => v.status !== "closed").slice(0, 2);
  const pendingVerifyCount = proofSubmissions.filter((r) => r.status === "대기").length;

  /** 바로가기. 활동 기록·쪽지함은 MY 메뉴에 이미 있어 뺐고, 남긴 둘은 지금 상태를 함께 보여준다. */
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

  return (
    <Sheet>
      <HomeInstallPopup />
      {/* ① 나 */}
      <SheetGroup>
        <section className={styles.hero}>
          <Mascot size={68} className={styles.heroMascot} priority />
          <h1 className={styles.greeting}>
            안녕하세요, {profile.name}
            {content.homeCopy.greetingSuffix}
          </h1>
          <p className={styles.subGreeting}>{content.homeCopy.subGreeting}</p>

          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>총 봉사</p>
              <p className={styles.summaryValue}>{stats.totalHours}시간</p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>참여 활동</p>
              <p className={styles.summaryValue}>{stats.totalActivities}회</p>
            </div>
          </div>
        </section>
      </SheetGroup>

      {/* ② 이번 학기에 할 일 */}
      <SheetGroup>
        <section className={styles.quad}>
          <article>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>모집 중인 봉사</h2>
              <Link href="/volunteer" className={styles.panelMore}>
                전체&nbsp;&nbsp;›
              </Link>
            </div>
            {recruitingVolunteers.length > 0 ? (
              <div className={styles.volunteerList}>
                {recruitingVolunteers.map((v) => (
                  <VolunteerCard key={v.id} item={v} compact />
                ))}
              </div>
            ) : (
              <p className={styles.nextMeta}>지금은 모집 중인 봉사가 없어요.</p>
            )}
          </article>

          <article className={styles.nextCard}>
            <div className={styles.nextHead}>
              <h2 className={styles.cardTitle}>다음 활동</h2>
              {stats.nextThing && (
                <span className={styles.ddayBadge}>
                  {stats.nextThing.dday === 0 ? "오늘" : `D-${stats.nextThing.dday}`}
                </span>
              )}
            </div>
            {stats.nextThing ? (
              <>
                <p className={styles.nextOrg}>{stats.nextThing.meta}</p>
                <p className={styles.nextTitle}>{stats.nextThing.title}</p>
                <p className={styles.nextWhen}>{stats.nextThing.dateLabel}</p>
                <p className={styles.nextMeta}>{stats.nextThing.place}</p>
              </>
            ) : (
              <p className={styles.nextMeta}>
                예정된 활동이 없어요.
                <br />
                봉사모집에서 신청해 보세요.
              </p>
            )}
          </article>

          <article>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>공지사항</h2>
              <Link href="/community" className={styles.panelMore}>
                전체&nbsp;&nbsp;›
              </Link>
            </div>
            <ul className={styles.noticeList}>
              {notices.slice(0, 3).map((n) => (
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
            <AlbumPreview />
          </article>
        </section>
      </SheetGroup>

      {/* ③ 내 자리 */}
      <SheetGroup>
        {myTeam && (
          <Link href="/my/team" className={styles.teamCard}>
            <div>
              <p className={styles.teamLabel}>내 조</p>
              <p className={styles.teamName}>{myTeam.teamName}</p>
            </div>
            <span className={styles.teamMore}>
              조원 {myTeam.members.length}명 보기&nbsp;&nbsp;›
            </span>
          </Link>
        )}

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
