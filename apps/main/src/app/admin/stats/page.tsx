import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { ExportButtons } from "./ExportButtons";
import { categoryStats, monthlyStats } from "@/lib/admin-data";
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
        <ExportButtons />
      </Panel>
    </>
  );
}
