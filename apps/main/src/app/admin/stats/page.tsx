import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { ExportButtons } from "./ExportButtons";
import { categoryStats, monthlyStats } from "@/lib/admin-data";
import { activities, activityTypes } from "@/lib/activities";
import styles from "./stats.module.css";

export const metadata = { title: "통계·내보내기 · 해랑사리우" };

const TYPE_TONE = { 개강파티: "orange", MT: "blue", 친목: "purple", 총회: "green" } as const;

export default function AdminStatsPage() {
  const max = Math.max(...monthlyStats.map((m) => m.hours));
  const totalHours = monthlyStats.reduce((s, m) => s + m.hours, 0);

  const typeCounts = activityTypes
    .filter((t) => t !== "전체")
    .map((type) => ({
      type,
      count: activities.filter((a) => a.type === type).length,
    }))
    .filter((t) => t.count > 0);
  const typeMax = Math.max(...typeCounts.map((t) => t.count), 1);

  const attendCounts = [
    { label: "참석", count: activities.filter((a) => a.attend === "참석").length },
    { label: "미정", count: activities.filter((a) => a.attend === "미정").length },
    { label: "불참", count: activities.filter((a) => a.attend === "불참").length },
    { label: "미응답", count: activities.filter((a) => a.attend === null).length },
  ];

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

        <Panel title="분야별 비중" desc="참여 봉사 기준">
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

      <div className={styles.layout}>
        <Panel title="활동 유형별 건수" desc="이번 학기 등록된 활동(봉사 제외) 기준">
          <div className={styles.catList}>
            {typeCounts.map((t) => (
              <div key={t.type} className={styles.catRow}>
                <div className={styles.catHead}>
                  <span className={styles.catLabel}>{t.type}</span>
                  <span className={styles.catValue}>{t.count}건</span>
                </div>
                <div className={styles.track}>
                  <div
                    className={cn(styles.fill, styles[TYPE_TONE[t.type as keyof typeof TYPE_TONE]])}
                    style={{ width: `${(t.count / typeMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="활동 참석 현황" desc="부원 응답 기준">
          <div className={styles.attendRow}>
            {attendCounts.map((a) => (
              <div key={a.label} className={cn(styles.attendChip, styles[a.label])}>
                <span className={styles.attendValue}>{a.count}</span>
                <span className={styles.attendLabel}>{a.label}</span>
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
