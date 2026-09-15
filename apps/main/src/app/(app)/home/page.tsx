import { WeatherCard } from "@/components/home/WeatherCard";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { VolunteerCard } from "@/components/volunteer/VolunteerCard/VolunteerCard";
import {
  BrandIcon,
  type BrandIconName,
} from "@/components/ui/BrandIcon/BrandIcon";
import { getNotices } from "@/lib/notices";
import { getAnonPosts } from "@/lib/anon-posts";
import { getMyProofSubmissions } from "@/lib/proof";
import { getMyTeam } from "@/lib/teams";
import { getAppContent } from "@/lib/app-content-queries";
import { getMyStats } from "@/lib/my-stats";
import { getCurrentMember } from "@/lib/get-current-member";
import { getInternalActivities } from "@/lib/volunteers";
import { getExternalVolunteers } from "@/lib/external";
import { isLocalAdminBypass } from "@/lib/local-admin";
import { AlbumPreview } from "./AlbumPreview";
import styles from "./home.module.css";
const QUICK: { label: string; href: string; icon: BrandIconName }[] = [
  { label: "봉사 인증", href: "/verify", icon: "certificate" },
  { label: "캘린더", href: "/calendar", icon: "calendar" },
  { label: "내 조", href: "/my/team", icon: "team" },
  { label: "활동 기록", href: "/my/records", icon: "heart" },
];
export default async function HomePage() {
  const profile = await getCurrentMember();
  if (!profile) redirect("/");
  if (!isLocalAdminBypass()) after(() => getExternalVolunteers());
  const [activities, proofs, notices, posts, team, stats, content] =
    await Promise.all([
      getInternalActivities(),
      getMyProofSubmissions(),
      getNotices(),
      getAnonPosts(),
      getMyTeam(),
      getMyStats(),
      getAppContent(),
    ]);
  const recruiting = activities
    .filter((v) => v.status !== "closed")
    .slice(0, 2);
  const pending = proofs.filter((r) => r.status === "대기").length;
  return (
    <div className={styles.page} data-full-bleed>
      <WeatherCard volunteerPlace={stats.nextThing?.place} />
      <Link
        href={notices[0] ? `/community/notice/${notices[0].id}` : "/community"}
        className={styles.noticeStrip}
      >
        <BrandIcon name="bell" size={28} />
        <strong>공지</strong>
        <span>{notices[0]?.title ?? "우리의 새로운 소식을 만나보세요"}</span>
        <b aria-hidden="true">›</b>
      </Link>
      <div className={styles.anonStrip}>
        {posts.length ? (
          posts.slice(0, 2).map((p) => (
            <Link
              key={p.id}
              href={`/community/anon/${p.id}`}
              className={styles.anonRow}
            >
              <BrandIcon name="chat" size={28} />
              <strong>익명</strong>
              <span>{p.title}</span>
              <small>댓글 {p.commentCount}</small>
              <b aria-hidden="true">›</b>
            </Link>
          ))
        ) : (
          <Link href="/community?tab=익명" className={styles.anonRow}>
            <BrandIcon name="chat" size={28} />
            <strong>익명</strong>
            <span>어떤 이야기든 편하게 남겨보세요</span>
            <b aria-hidden="true">›</b>
          </Link>
        )}
      </div>
      <nav className={styles.quickGrid} aria-label="자주 찾는 메뉴">
        {QUICK.map((q) => (
          <Link href={q.href} key={q.href}>
            <BrandIcon name={q.icon} size={54} />
            <span>{q.label}</span>
            {q.href === "/verify" && pending > 0 && (
              <b className={styles.count}>{pending}</b>
            )}
          </Link>
        ))}
      </nav>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>다음 만남은요</h2>
          <Link href="/calendar">캘린더 ↗</Link>
        </div>
        {stats.nextThing ? (
          <Link
            href={stats.nextThing.href as Route}
            className={styles.nextCard}
          >
            <BrandIcon name="calendar" size={58} />
            <div>
              <span className={styles.tag}>
                {stats.nextThing.dday === 0
                  ? "오늘"
                  : `D-${stats.nextThing.dday}`}
              </span>
              <h3>{stats.nextThing.title}</h3>
              <p>
                {stats.nextThing.dateLabel}  / {stats.nextThing.place}
              </p>
              {stats.nextThing.needsResponse && (
                <strong className={styles.respond}>참석 여부 정하기 →</strong>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/activities" className={styles.nextCard}>
            <BrandIcon name="calendar" size={58} />
            <div>
              <h3>다음 만남을 기다리는 중</h3>
              <p>새로운 활동이 열리면 여기서 만나요.</p>
            </div>
            <span aria-hidden="true">›</span>
          </Link>
        )}
        {stats.unansweredCount > 0 && (
          <Link href="/activities" className={styles.responseNotice}>
            참석 여부를 알려주세요 / {stats.unansweredCount}개 활동 →
          </Link>
        )}
      </section>
      <section className={styles.myWave}>
        <div className={styles.sectionHead}>
          <div>
            <h2>
              {profile.name}
              {content.homeCopy.greetingSuffix}
            </h2>
          </div>
          <Link href="/my" aria-label="내 활동 전체 보기">
            MY ↗
          </Link>
        </div>
        <p className={styles.welcomeNote}>{content.homeCopy.subGreeting}</p>
        <div className={styles.stats}>
          <Link href="/my/records">
            <span>함께한 시간</span>
            <strong>
              {stats.totalHours}
              <small>시간</small>
            </strong>
          </Link>
          <Link href="/activities">
            <span>참여한 활동</span>
            <strong>
              {stats.totalActivities}
              <small>회</small>
            </strong>
          </Link>
          {team && (
            <Link href="/my/team">
              <span>함께하는 우리</span>
              <strong className={styles.teamName}>{team.teamName}</strong>
            </Link>
          )}
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>함께할 봉사</h2>
          <Link href="/volunteer">전체 보기 ↗</Link>
        </div>
        {recruiting.length > 0 ? (
          <div className={styles.volunteers}>
            {recruiting.map((v) => (
              <VolunteerCard key={v.id} item={v} compact />
            ))}
          </div>
        ) : (
          <Link href="/volunteer" className={styles.exploreCard}>
            <div>
              <h3>나에게 맞는 봉사 찾기</h3>
              <p>날짜와 장소를 보고 골라보세요 →</p>
            </div>
            <BrandIcon name="heart" size={100} />
          </Link>
        )}
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>우리의 순간들</h2>
          <Link href="/community?tab=앨범">앨범 보기 ↗</Link>
        </div>
        <div className={styles.album}>
          <AlbumPreview />
        </div>
      </section>
    </div>
  );
}
