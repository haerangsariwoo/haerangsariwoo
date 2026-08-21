import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, tableStyles } from "@/components/admin/DataTable/DataTable";
import {
  metrics,
  pendingHours,
  quickActions,
  todayVolunteers,
  upcomingEvents,
} from "@/lib/admin-data";
import styles from "./dashboard.module.css";

const ICONS: Record<string, React.ReactNode> = {
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 7v6.5M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

const AUG_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const AUG_OFFSET = 4; // 8/1 = 금요일

export default function AdminDashboard() {
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
              <span className={cn(styles.metricIcon, styles[m.tone])}>{ICONS[m.icon]}</span>
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
        <Panel title="오늘의 봉사·출석" action={{ label: "전체 보기", href: "/admin/volunteers" }}>
          <div className={styles.toolbar}>
            <input className={styles.search} placeholder="봉사명·장소 검색" aria-label="봉사 검색" />
            <select className={styles.select} defaultValue="all" aria-label="상태 필터">
              <option value="all">상태: 전체</option>
              <option value="upcoming">진행 예정</option>
              <option value="ongoing">진행 중</option>
              <option value="closed">모집 마감</option>
            </select>
          </div>

          <DataTable columns={["봉사활동", "시간", "신청/정원", "출석", "상태"]}>
            {todayVolunteers.map((v) => (
              <tr key={v.id}>
                <td>{v.title}</td>
                <td className={cn(tableStyles.muted, tableStyles.numeric)}>{v.time}</td>
                <td className={tableStyles.numeric}>{v.applied}</td>
                <td className={tableStyles.numeric}>{v.attended}</td>
                <td>
                  <Badge tone={v.tone}>{v.status}</Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel
          title="봉사시간 승인 대기"
          count="7건"
          desc="증빙을 확인하고 실적을 반영하세요."
        >
          <div className={styles.approvalList}>
            {pendingHours.map((p) => (
              <div key={p.id} className={styles.approvalRow}>
                <span className={cn(styles.approvalAvatar, styles[p.tone])}>
                  {p.name.charAt(0)}
                </span>
                <div className={styles.approvalBody}>
                  <p className={styles.approvalName}>{p.name}</p>
                  <p className={styles.approvalActivity}>{p.activity}</p>
                </div>
                <span className={styles.approvalHours}>{p.hours}</span>
                <button type="button" className={styles.approvalButton}>
                  검토
                </button>
              </div>
            ))}
          </div>
          <p className={styles.batchBar}>☐ 3건 선택 · 일괄 승인</p>
        </Panel>
      </div>

      <div className={styles.rowB}>
        <Panel title="다가오는 일정" action={{ label: "8월", href: "/admin/volunteers" }}>
          <div className={styles.calendar}>
            {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
              <span key={d} className={styles.dayName}>
                {d}
              </span>
            ))}
            {Array.from({ length: AUG_OFFSET }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {AUG_DAYS.map((d) => (
              <span
                key={d}
                className={cn(
                  styles.day,
                  d === 16 && styles.eventOrange,
                  d === 22 && styles.eventBlue,
                )}
              >
                {d}
              </span>
            ))}
          </div>

          <div className={styles.eventList}>
            {upcomingEvents.map((e) => (
              <div key={e.id} className={styles.eventRow}>
                <span className={cn(styles.eventDot, styles[e.tone])} />
                <span className={styles.eventTitle}>
                  {e.date}&nbsp;&nbsp;{e.title}
                </span>
                <span className={styles.eventTime}>{e.time}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="빠른 작업">
          <div className={styles.quickGrid}>
            {quickActions.map((q) => (
              <Link key={q.id} href={q.href} className={styles.quickCard}>
                <span className={cn(styles.quickIcon, styles[q.tone])}>
                  {ICONS[q.tone === "orange" ? "check" : q.tone === "blue" ? "alert" : "plus"]}
                </span>
                <span>
                  <span className={styles.quickLabel}>{q.label}</span>
                  <span className={styles.quickDesc}>{q.desc}</span>
                </span>
                <span className={styles.quickChev}>›</span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
