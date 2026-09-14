import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { getDashboard } from "@/lib/dashboard";
import { PendingHoursPanel, TodayVolunteersPanel } from "./DashboardPanels";
import styles from "./dashboard.module.css";

/** 이번 달 달력에 찍을 날짜들 — 1일이 무슨 요일인지에 맞춰 앞을 비운다 */
function monthGrid(now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  // 월요일 시작 달력이라 일요일(0)을 6으로 민다
  const first = (new Date(year, month, 1).getDay() + 6) % 7;
  return { month: month + 1, days: Array.from({ length: days }, (_, i) => i + 1), offset: first };
}

const QUICK_ACTIONS = [
  { id: "qa1", label: "봉사시간 승인", href: "/admin/activities?tab=hours" as const, tone: "orange" as const },
  { id: "qa2", label: "신청자 관리", desc: "참여 여부 확인", href: "/admin/activities?tab=applicants" as const, tone: "blue" as const },
  { id: "qa3", label: "가입 승인", desc: "신규 가입 신청 검토", href: "/admin/members" as const, tone: "green" as const },
  { id: "qa4", label: "팀짜기", desc: "행사 조 편성", href: "/admin/teams" as const, tone: "purple" as const },
];

export default async function AdminDashboard() {
  const { metrics, todayVolunteers, pendingHours, upcoming, pendingHourCount } =
    await getDashboard();

  const today = new Date();
  const grid = monthGrid(today);
  const eventDays = new Set(upcoming.map((e) => Number(e.date.split(".")[1])));
  const quickActions = QUICK_ACTIONS.map((q) =>
    q.id === "qa1" ? { ...q, desc: `${pendingHourCount}건의 증빙 검토` } : q,
  );

  return (
    <>
      <div className={styles.intro}>
        <h2 className={styles.introTitle}>오늘 운영 현황</h2>
        <p className={styles.introDesc}>부원 활동과 처리할 업무를 한눈에 확인하세요.</p>
      </div>

      <div className={styles.metricRow}>
        {metrics.map((m) => (
          <div key={m.label} className={styles.metric}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>{m.label}</span>
            </div>
            <div className={styles.metricBottom}>
              <span className={styles.metricValue}>{m.value}</span>
              <span className={cn(styles.metricCaption, styles[m.tone])}>{m.caption}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.rowA}>
        <Panel title="오늘의 봉사 / 출석" action={{ label: "전체 보기", href: "/admin/activities" }}>
          <TodayVolunteersPanel items={todayVolunteers} />
        </Panel>

        <Panel
          title="봉사시간 승인 대기"
          count={`${pendingHourCount}건`}
          desc="증빙을 확인하고 실적을 반영하세요."
        >
          <PendingHoursPanel items={pendingHours} />
        </Panel>
      </div>

      <div className={styles.rowB}>
        <Panel title="다가오는 일정" action={{ label: `${grid.month}월`, href: "/admin/activities?tab=events" }}>
          <div className={styles.calendar}>
            {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
              <span key={d} className={styles.dayName}>
                {d}
              </span>
            ))}
            {Array.from({ length: grid.offset }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {grid.days.map((d) => (
              <span
                key={d}
                className={cn(
                  styles.day,
                  eventDays.has(d) && styles.eventBlue,
                  d === today.getDate() && styles.eventOrange,
                )}
              >
                {d}
              </span>
            ))}
          </div>

          <div className={styles.eventList}>
            {upcoming.length === 0 && <p className={styles.introDesc}>예정된 활동이 없습니다.</p>}
            {upcoming.map((e) => (
              <div key={e.id} className={styles.eventRow}>
                <span className={cn(styles.eventDot, styles[e.tone])} />
                <span className={styles.eventTitle}>
                  {e.date}&nbsp;&nbsp;{e.title}
                </span>
                <span className={styles.eventTime}>
                  {e.dday === 0 ? "오늘" : `D-${e.dday}`}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="빠른 작업">
          <div className={styles.quickGrid}>
            {quickActions.map((q) => (
              <Link key={q.id} href={q.href} className={styles.quickCard}>
                <span>
                  <span className={styles.quickLabel}>{q.label}</span>
                  <span className={styles.quickDesc}>{q.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
