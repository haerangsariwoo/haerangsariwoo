import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { createClient } from "@/lib/supabase/server";
import { recruitConfig } from "@/lib/recruit-config";
import type { Applicant, SlotRow } from "@/lib/admin-data";
import styles from "./dashboard.module.css";

export default async function RecruitDashboard() {
  const supabase = await createClient();

  const [{ data: applicantData }, { data: slotData }] = await Promise.all([
    supabase
      .from("applicants")
      .select("id, student_id, name, track, phone, motivation, applied_at, first_result, interview, final_result")
      .order("applied_at", { ascending: false }),
    supabase.from("interview_slots").select("*").order("slot_date", { ascending: true }),
  ]);

  const applicants = (applicantData ?? []) as Applicant[];
  const slots = (slotData ?? []) as SlotRow[];

  const firstPassCount = applicants.filter((a) => a.first_result === "합격").length;
  const bookedCount = applicants.filter((a) => a.interview).length;
  const finalPassCount = applicants.filter((a) => a.final_result === "합격").length;

  const metrics = [
    { label: "총 지원", value: String(applicants.length), unit: "명", tone: "blue" as const },
    { label: "1차 합격", value: String(firstPassCount), unit: "명", tone: "green" as const },
    { label: "면접 예약", value: String(bookedCount), unit: `/ ${firstPassCount}`, tone: "orange" as const },
    { label: "최종 합격", value: String(finalPassCount), unit: "명", tone: "purple" as const },
  ];

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
        {metrics.map((m) => (
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

        <Panel title="면접 슬롯 현황" count={`예약 ${bookedCount} / ${slots.reduce((sum, s) => sum + s.capacity, 0)}`}>
          <div className={styles.progressWrap}>
            {slots.map((s) => {
              const count = applicants.filter((a) => a.interview?.startsWith(s.slot_date)).length;
              const pct = s.capacity > 0 ? Math.round((count / s.capacity) * 100) : 0;
              return (
                <div key={s.id} className={styles.progressRow}>
                  <div className={styles.progressHead}>
                    <span className={styles.progressLabel}>{s.slot_date}</span>
                    <span className={styles.progressValue}>
                      {count}/{s.capacity}
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
            {slots.length === 0 && <p className={ui.muted}>열어둔 면접 슬롯이 없습니다.</p>}
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
                  <td className={cn(ui.muted, ui.numeric)}>{a.student_id}</td>
                  <td className={ui.muted}>{a.track}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.applied_at?.slice(5, 10)}</td>
                  <td>
                    <Badge tone={a.first_result === "합격" ? "green" : a.first_result === "불합격" ? "danger" : "grey"}>
                      {a.first_result}
                    </Badge>
                  </td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.interview ?? "미선택"}</td>
                  <td>
                    <Badge tone={a.final_result === "합격" ? "green" : a.final_result === "불합격" ? "danger" : "grey"}>
                      {a.final_result}
                    </Badge>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={7} className={ui.muted}>
                    아직 지원자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
