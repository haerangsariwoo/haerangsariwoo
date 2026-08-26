import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { ExportButtons } from "./ExportButtons";
import { getAdminStats } from "@/lib/stats";
import styles from "./stats.module.css";

export const metadata = { title: "통계·내보내기 · 해랑사리우" };

const TYPE_TONE = {
  개강파티: "orange",
  MT: "blue",
  친목: "purple",
  총회: "green",
  회의: "blue",
} as const;

export default async function AdminStatsPage() {
  const { monthly, totalHours, categories, typeCounts, attendCounts } = await getAdminStats();

  const max = Math.max(...monthly.map((m) => m.hours), 1);
  const typeMax = Math.max(...typeCounts.map((t) => t.count), 1);
  const year = new Date().getFullYear();

  return (
    <>
      <div className={styles.layout}>
        <Panel title="월별 봉사시간" desc={`${year}년 승인된 증빙 누적 ${totalHours}시간`}>
          {totalHours === 0 ? (
            <p className={styles.emptyNote}>아직 승인된 봉사 증빙이 없습니다.</p>
          ) : (
            <div className={styles.chart}>
              {monthly.map((m) => (
                <div key={m.month} className={styles.barCol}>
                  <span className={styles.barValue}>{m.hours}</span>
                  <span className={styles.bar} style={{ height: `${(m.hours / max) * 100}%` }} />
                  <span className={styles.barLabel}>{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="분야별 비중" desc="참여확정된 내부봉사 기준">
          {categories.length === 0 ? (
            <p className={styles.emptyNote}>아직 참여확정된 봉사가 없습니다.</p>
          ) : (
            <div className={styles.catList}>
              {categories.map((c) => (
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
          )}
        </Panel>
      </div>

      <div className={styles.layout}>
        <Panel title="활동 유형별 건수" desc="등록된 동아리 활동(봉사 제외) 기준">
          {typeCounts.length === 0 ? (
            <p className={styles.emptyNote}>등록된 활동이 없습니다.</p>
          ) : (
            <div className={styles.catList}>
              {typeCounts.map((t) => (
                <div key={t.type} className={styles.catRow}>
                  <div className={styles.catHead}>
                    <span className={styles.catLabel}>{t.type}</span>
                    <span className={styles.catValue}>{t.count}건</span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={cn(styles.fill, styles[TYPE_TONE[t.type]])}
                      style={{ width: `${(t.count / typeMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="활동 참석 현황" desc="전 부원 응답 기준">
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
