import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import { Logo } from "@/components/ui/Logo/Logo";
import {
  activityCards,
  brand,
  cohortLabel,
  landing,
  navItems,
  recruitConfig,
} from "@/lib/recruit-config";
import { ActivityGallery } from "./ActivityGallery";
import { FaqList } from "./FaqList";
import { HeroSlider } from "./HeroSlider";
import styles from "./page.module.css";

export default function LandingPage() {
  const { applicationsOpen } = recruitConfig;
  const cohort = cohortLabel(recruitConfig.year, recruitConfig.semesterNo);

  const schedule = [
    { label: "지원서 접수", value: `${recruitConfig.applyStart} – ${recruitConfig.applyEnd}` },
    { label: "1차 서류 발표", value: recruitConfig.firstResultDate },
    { label: "대면 면접", value: recruitConfig.interviewRange },
    { label: "최종 발표", value: recruitConfig.finalResultDate },
  ];

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <Logo size={34} priority />
          </Link>

          <nav className={styles.nav}>
            {navItems.map((n) => (
              <a key={n.href} href={n.href} className={styles.navLink}>
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <HeroSlider applicationsOpen={applicationsOpen} />

      {/* ---------- About ----------
          Recruiting 과 같은 이유로 제목을 그리드 안, 글 칼럼 맨 위로
          옮긴다 — 사진 윗변과 "About" 제목이 같은 줄에서 시작해야 한다. */}
      <section id="about" className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutTextWrap}>
              <h2 className={styles.sectionTitle}>{landing.about.title}</h2>
              <p className={styles.aboutText}>{landing.about.body}</p>
              {/* §5 — 성과를 숫자로 자랑하지 않고 연도 사실만 적는다 */}
              <div className={styles.aboutFacts}>
                <div className={styles.fact}>
                  <span className={styles.factValue}>1996</span>
                  <span className={styles.factLabel}>한성대학교 중앙 봉사동아리로 창설</span>
                </div>
                <div className={styles.fact}>
                  <span className={styles.factValue}>30년</span>
                  <span className={styles.factLabel}>지금까지 이어온 봉사의 전통</span>
                </div>
              </div>
            </div>

            <div className={styles.aboutPhoto}>
              <Image
                className={styles.aboutPhotoImage}
                src="/landing/about.svg"
                alt="해랑사리우 활동 사진"
                fill
                sizes="(min-width: 1200px) 560px, 100vw"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Activities ---------- */}
      <section id="activities" className={cn(styles.section, styles.sectionTinted)}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>{landing.activities.title}</h2>
          <p className={styles.sectionLead}>{landing.activities.lead}</p>
          <div className={styles.sectionBody}>
            <ActivityGallery cards={activityCards} />
          </div>
        </div>
      </section>

      {/* ---------- Recruiting ----------
          제목·리드를 그리드 밖에 두면 오른쪽 일정 카드보다 한참 아래에서
          칼럼이 시작돼, 카드 윗변이 "우리는 이런 분들을..." 과 맞고
          "Recruiting" 제목과는 어긋난다. 제목·리드를 왼쪽 칼럼 맨 위로
          옮겨 카드 윗변과 "Recruiting" 이 같은 줄에서 시작하게 한다. */}
      <section id="recruiting" className={cn(styles.section, styles.sectionSheet)}>
        <div className={styles.inner}>
          {/* sectionBody(제목 아래 여백)를 안 쓴다 — 제목이 이제 grid 안,
              recruitLeft 맨 위에 있어서 grid 자체가 바로 .inner 상단에
              붙어야 한다. 여백은 .checklistTitle 쪽에서 준다. */}
          <div className={styles.recruitGrid}>
            <div className={styles.recruitLeft}>
              <h2 className={styles.sectionTitle}>{landing.recruiting.title}</h2>
              <p className={styles.sectionLead}>{landing.recruiting.lead}</p>

              <h3 className={styles.checklistTitle}>{landing.recruiting.checklistTitle}</h3>
              <ul className={styles.checklist}>
                {landing.recruiting.checklist.map((item) => (
                  <li key={item} className={styles.checkItem}>
                    <span className={styles.checkMark} aria-hidden="true">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.quote}>{landing.recruiting.quote}</p>
            </div>

            <div className={styles.scheduleCard}>
              <p className={styles.scheduleHead}>
                모집 일정
                <span className={styles.cohortTag}>{cohort}</span>
              </p>

              <div className={styles.scheduleList}>
                {schedule.map((s) => (
                  <div key={s.label} className={styles.scheduleRow}>
                    <span className={styles.scheduleLabel}>{s.label}</span>
                    <span className={styles.scheduleValue}>{s.value}</span>
                  </div>
                ))}
              </div>

              {applicationsOpen ? (
                <div className={styles.scheduleActions}>
                  <Link href="/apply">
                    <Button size="md">지원하기 →</Button>
                  </Link>
                  <Link href="/apply/status">
                    <Button size="md" variant="secondary">
                      결과 확인
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className={styles.closedNote}>
                  현재는 지원서를 받지 않습니다. 다음 모집 일정은 준비되는 대로 이곳과 공식
                  Instagram 에 안내드립니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>Q&amp;A</h2>
          <p className={styles.sectionLead}>지원 전 가장 많이 받는 질문입니다.</p>
          <div className={styles.sectionBody}>
            <FaqList />
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.footerGrid}>
            <div>
              <p className={styles.footerTitle}>{brand.name}</p>
              <p className={styles.footerText}>
                한성대학교 중앙 봉사동아리
                <br />
                {landing.footer.address}
              </p>
            </div>

            <div>
              <p className={styles.footerTitle}>바로가기</p>
              <div className={styles.footerLinks}>
                <a
                  className={styles.footerLink}
                  href={landing.footer.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram {landing.footer.instagramLabel}
                </a>
                <Link className={styles.footerLink} href="/apply">
                  신입 부원 지원하기
                </Link>
                <Link className={styles.footerLink} href="/apply/status">
                  지원 결과 확인
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© {recruitConfig.year} 해랑사리우. All rights reserved.</span>
            <Link href="/admin/login" className={styles.adminLink}>
              관리자 페이지
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
