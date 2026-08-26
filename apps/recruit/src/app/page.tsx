import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo/Logo";
import { brand, cohortLabel, credits, instagramLabel, landing, navItems } from "@/lib/recruit-config";
import { getLandingContent, getRecruitSettings } from "@/lib/content-queries";
import { AboutPhoto } from "./AboutPhoto";
import { ActivityGallery } from "./ActivityGallery";
import { FaqList } from "./FaqList";
import { HeroSlider } from "./HeroSlider";
import styles from "./page.module.css";

export default async function LandingPage() {
  const [config, content] = await Promise.all([getRecruitSettings(), getLandingContent()]);
  const { applicationsOpen } = config;
  const cohort = cohortLabel(config.year, config.semesterNo);

  const schedule = [
    { label: "지원서 접수", value: `${config.applyStart} – ${config.applyEnd}` },
    { label: "1차 서류 발표", value: config.firstResultDate },
    { label: "대면 면접", value: config.interviewRange },
    { label: "최종 발표", value: config.finalResultDate },
  ];

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <Logo size={44} priority />
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

      <HeroSlider applicationsOpen={applicationsOpen} slides={content.heroSlides} />

      {/* ---------- About ----------
          Recruiting 과 같은 이유로 제목을 그리드 안, 글 칼럼 맨 위로
          옮긴다 — 사진 윗변과 "About" 제목이 같은 줄에서 시작해야 한다. */}
      <section id="about" className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutTextWrap}>
              <h2 className={styles.sectionTitle}>{landing.about.title}</h2>
              <p className={styles.aboutText}>{content.aboutBody}</p>
              {/* §5 — 성과를 숫자로 자랑하지 않고 연도 사실만 적는다 */}
              <div className={styles.aboutFacts}>
                {content.aboutFacts.map((f) => (
                  <div key={f.label} className={styles.fact}>
                    <span className={styles.factValue}>{f.value}</span>
                    <span className={styles.factLabel}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <AboutPhoto photo={content.aboutPhoto} />
          </div>
        </div>
      </section>

      {/* ---------- Activities ---------- */}
      <section id="activities" className={cn(styles.section, styles.sectionTinted)}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>{landing.activities.title}</h2>
          <p className={styles.sectionLead}>{content.activitiesLead}</p>
          <div className={styles.sectionBody}>
            <ActivityGallery cards={content.activityCards} />
          </div>
          <div className={styles.moreRow}>
            <a
              className={styles.ctaSecondary}
              href={content.footerInstagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              더 알아보기 →
            </a>
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
              <p className={styles.sectionLead}>{content.recruitingLead}</p>

              <h3 className={styles.checklistTitle}>{content.checklistTitle}</h3>
              <ul className={styles.checklist}>
                {content.checklist.map((item) => (
                  <li key={item} className={styles.checkItem}>
                    <span className={styles.checkMark} aria-hidden="true">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.quote}>{content.quote}</p>
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
                  <Link href="/apply" className={styles.ctaPrimary}>
                    지원하기 →
                  </Link>
                  <Link href="/apply/status" className={styles.ctaSecondary}>
                    결과 확인
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
            <FaqList faqs={content.faqs} />
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
                {content.footerAddress}
              </p>
            </div>

            <div>
              <p className={styles.footerTitle}>바로가기</p>
              <div className={styles.footerLinks}>
                <a
                  className={styles.footerLink}
                  href={content.footerInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram {instagramLabel(content.footerInstagram)}
                </a>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© {config.year} 해랑사리우. All rights reserved.</span>
            <span className={styles.credit}>
              Created by {credits.createdBy}
              <span className={styles.creditDot}>·</span>
              Assisted by {credits.assistedBy.join(" · ")}
            </span>
            <Link href="/login" className={styles.adminLink}>
              관리자 페이지
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
