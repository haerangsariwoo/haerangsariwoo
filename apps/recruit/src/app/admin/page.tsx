import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { applicants, recruitMetrics, slotRows } from "@/lib/admin-data";
import { recruitConfig } from "@/lib/recruit-config";
import styles from "./dashboard.module.css";

export default function RecruitDashboard() {
  const stages = [
    { no: 1, label: "지원서 접수", date: `${recruitConfig.applyStart} – ${recruitConfig.applyEnd}` },
    { no: 2, label: "1차 서류 발표", date: recruitConfig.firstResultDate },
    { no: 3, label: "대면 면접", date: recruitConfig.interviewRange },
    { no: 4, label: "최종 발표", date: recruitConfig.finalResultDate },
  ];

  const recent = applicants.slice(0, 4);

  return (
    <>
      <div className={styles.metricRow}>
        {recruitMetrics.map((m) => (
          <div key={m.label} className={styles.metric}>
            <p className={styles.metricLabel}>{m.label}</p>
            <p className={cn(styles.metricValue, styles[m.tone])}>
              {m.value}
              <span className={styles.metricUnit}>{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className={styles.row}>
        <Panel title="모집 일정" desc="일정은 모집 설정에서 학기마다 변경할 수 있습니다.">
          <div className={styles.stageList}>
            {stages.map((s) => (
              <div key={s.no} className={styles.stageRow}>
                <span className={styles.stageNo}>{s.no}</span>
                <span className={styles.stageLabel}>{s.label}</span>
                <span className={styles.stageDate}>{s.date}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="면접 슬롯 현황" count="예약 28 / 32">
          <div className={styles.progressWrap}>
            {slotRows.map((s) => {
              const pct = Math.round((s.booked / s.capacity) * 100);
              return (
                <div key={s.id} className={styles.progressRow}>
                  <div className={styles.progressHead}>
                    <span className={styles.progressLabel}>{s.date}</span>
                    <span className={styles.progressValue}>
                      {s.booked}/{s.capacity}
                    </span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={cn(styles.fill, pct >= 100 && styles.full)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="최근 지원자" count={`${applicants.length}명`}>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>학번</th>
                <th>학부 · 트랙</th>
                <th>지원일</th>
                <th>1차</th>
                <th>면접</th>
                <th>최종</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.studentId}</td>
                  <td className={ui.muted}>{a.track}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.appliedAt}</td>
                  <td>
                    <Badge tone={a.first === "합격" ? "green" : a.first === "불합격" ? "danger" : "grey"}>
                      {a.first}
                    </Badge>
                  </td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.interview ?? "미선택"}</td>
                  <td>
                    <Badge tone={a.final === "합격" ? "green" : a.final === "불합격" ? "danger" : "grey"}>
                      {a.final}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
