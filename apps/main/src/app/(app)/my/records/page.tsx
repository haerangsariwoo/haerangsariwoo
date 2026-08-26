import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { getMyStats } from "@/lib/my-stats";
import myStyles from "../my.module.css";
import styles from "./records.module.css";

export const metadata = { title: "활동 기록 · 해랑사리우" };

export default async function RecordsPage() {
  const { records, totalHours } = await getMyStats();

  const upcoming = records.filter(
    (r) => r.state === "참여확정" || r.state === "신청완료" || r.state === "대기",
  );
  const past = records.filter(
    (r) => r.state === "활동완료" || r.state === "취소" || r.state === "불참",
  );

  return (
    <div className={styles.page}>
      <PageHeader title="활동 기록" back={{ href: "/my", label: "MY" }} />

      <section className={styles.summary}>
        <div>
          <p className={styles.summaryLabel}>완료한 활동</p>
          <p className={styles.summaryValue}>
            {past.filter((r) => r.state === "활동완료").length}건
          </p>
        </div>
        <div className={styles.divider} />
        <div>
          <p className={styles.summaryLabel}>인정 봉사시간</p>
          <p className={styles.summaryValue}>{totalHours}시간</p>
        </div>
      </section>

      <section>
        <h2 className={styles.groupTitle}>예정 · 대기</h2>
        <div className={myStyles.recordList}>
          {upcoming.length === 0 && <p className={myStyles.recordMeta}>예정된 활동이 없어요.</p>}
          {upcoming.map((r) => (
            <div key={r.id} className={myStyles.recordCard}>
              <div className={myStyles.recordBody}>
                <p className={myStyles.recordTitle}>{r.title}</p>
                <p className={myStyles.recordMeta}>{r.date}</p>
              </div>
              <span className={cn(myStyles.state, myStyles[r.state])}>{r.state}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles.groupTitle}>지난 활동</h2>
        <div className={myStyles.recordList}>
          {past.length === 0 && <p className={myStyles.recordMeta}>지난 활동이 없어요.</p>}
          {past.map((r) => (
            <div key={r.id} className={myStyles.recordCard}>
              <div className={myStyles.recordBody}>
                <p className={myStyles.recordTitle}>{r.title}</p>
                <p className={myStyles.recordMeta}>
                  {r.date}
                  {r.hours ? ` · 인정 ${r.hours}시간` : ""}
                </p>
              </div>
              <span className={cn(myStyles.state, myStyles[r.state])}>{r.state}</span>
            </div>
          ))}
        </div>
      </section>

      <p className={myStyles.note}>
        참여 여부는 운영진이 신청자 관리에서 확인·처리하며, 승인된 실적만 시간에 반영됩니다.
      </p>
    </div>
  );
}
