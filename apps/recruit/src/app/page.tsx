import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import {
  cohortLabel,
  activityCards,
  brand,
  faqs,
  processSteps,
  recruitConfig,
} from "@/lib/recruit-config";
import styles from "./page.module.css";
import { Logo } from "@/components/ui/Logo/Logo";

export default function LandingPage() {
  const { applicationsOpen, semester } = recruitConfig;
  const cohort = cohortLabel(recruitConfig.year, recruitConfig.semesterNo);

  const schedule = [
    { label: "지원서 접수", value: `${recruitConfig.applyStart} – ${recruitConfig.applyEnd}` },
    { label: "1차 서류 발표", value: recruitConfig.firstResultDate },
    { label: "대면 면접", value: recruitConfig.interviewRange },
    { label: "최종 발표", value: recruitConfig.finalResultDate },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroBrand}>
            <Logo size={26} className={styles.mascot} priority />
            <span className={styles.wordmark}>{brand.name}</span>
          </div>

          <h1 className={styles.slogan}>
            {brand.slogan1}
            <br />
            {brand.slogan2}
          </h1>
          <p className={styles.tradition}>{brand.tradition}</p>

          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, !applicationsOpen && styles.closed)}>
              {applicationsOpen ? `${cohort} 신입부원 모집 중` : "모집 준비 중"}
            </span>
          </div>

          <p className={styles.heroNote}>
            {applicationsOpen
              ? `${semester} · 지원 일정과 자격은 매 학기 운영진이 설정합니다.`
              : "다음 모집 일정은 준비되는 대로 이곳에 안내드립니다."}
          </p>

          <span className={styles.dolphinCircle}>
            <Logo size={48} priority />
          </span>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>해랑사리우에서 함께해요</h2>
          <div className={styles.activityGrid}>
            {activityCards.map((a) => (
              <article key={a.id} className={styles.activityCard}>
                <div className={styles.photo}>
                  {a.photoUrl ? (
                    <Image src={a.photoUrl} alt={a.title} width={94} height={54} unoptimized />
                  ) : (
                    <Image
                      src="/icons/photo.svg"
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                    />
                  )}
                </div>
                <h3 className={styles.activityTitle}>{a.title}</h3>
                <p className={styles.activityDesc}>{a.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.processCard}>
            <h2 className={styles.processTitle}>모집 절차</h2>
            <div className={styles.steps}>
              {processSteps.map((s, i) => (
                <div key={s.no} className={styles.stepItem}>
                  {i < processSteps.length - 1 && <span className={styles.stepLine} />}
                  <span className={cn(styles.stepDot, i === 0 && styles.active)}>{s.no}</span>
                  <span className={styles.stepLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.scheduleList}>
              {schedule.map((s) => (
                <div key={s.label} className={styles.scheduleRow}>
                  <span className={styles.scheduleLabel}>{s.label}</span>
                  <span className={styles.scheduleValue}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
          <div className={styles.faqList}>
            {faqs.map((f) => (
              <div key={f.q} className={styles.faqItem}>
                <p className={styles.faqQ}>
                  <span className={styles.faqMark}>Q</span>
                  {f.q}
                </p>
                <p className={styles.faqA}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.ctaWrap}>
          {applicationsOpen ? (
            <>
              <Link href="/apply">
                <Button variant="primary" size="lg" fullWidth>
                  지원 시작하기
                </Button>
              </Link>
              <Link href="/apply" className={styles.subLink}>
                이미 지원했나요? 결과 확인
              </Link>
            </>
          ) : (
            <>
              <p className={styles.closedNote}>
                현재는 모집 기간이 아닙니다.
                <br />
                모집이 시작되면 이곳에서 지원할 수 있어요.
              </p>
              <Link href="/apply" className={styles.subLink}>
                지난 지원 결과 확인하기
              </Link>
            </>
          )}
        </div>

        <p className={styles.footer}>
          해랑사리우 · 한성대학교 봉사동아리
          <br />
          문의는 공식 채널을 이용해 주세요.
        </p>
      </div>
    </main>
  );
}
