import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { categoryStats, monthlyStats } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./stats.module.css";

export const metadata = { title: "통계·내보내기 · 해랑사리우" };

export default function AdminStatsPage() {
  const max = Math.max(...monthlyStats.map((m) => m.hours));
  const totalHours = monthlyStats.reduce((s, m) => s + m.hours, 0);

  return (
    <>
      <div className={styles.layout}>
        <Panel title="월별 봉사시간" desc={`2026-1학기 누적 ${totalHours}시간`}>
          <div className={styles.chart}>
            {monthlyStats.map((m) => (
              <div key={m.month} className={styles.barCol}>
                <span className={styles.barValue}>{m.hours}</span>
                <span className={styles.bar} style={{ height: `${(m.hours / max) * 100}%` }} />
                <span className={styles.barLabel}>{m.month}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="분야별 비중" desc="참여 활동 기준">
          <div className={styles.catList}>
            {categoryStats.map((c) => (
              <div key={c.label} className={styles.catRow}>
                <div className={styles.catHead}>
                  <span className={styles.catLabel}>{c.label}</span>
                  <span className={styles.catValue}>{c.value}%</span>
                </div>
                <div className={styles.track}>
                  <div
                    className={cn(styles.fill, styles[c.tone])}
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="내보내기" desc="회계·학교 제출용 자료를 파일로 저장합니다.">
        <div className={styles.exportRow}>
          <button type="button" className={cn(toolbar.button, toolbar.sheet)}>
            구글 스프레드시트로 내보내기
          </button>
          <button type="button" className={toolbar.button}>
            봉사시간 CSV
          </button>
          <button type="button" className={toolbar.button}>
            회원 명단 CSV
          </button>
          <button type="button" className={toolbar.button}>
            출석 현황 CSV
          </button>
        </div>
      </Panel>
    </>
  );
}
