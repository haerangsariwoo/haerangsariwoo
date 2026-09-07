import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { createClient } from "@/lib/supabase/server";
import { getRecruitSettings } from "@/lib/content-queries";
import type { Applicant, SlotRow } from "@/lib/admin-data";
import { expandSlot } from "@/lib/interview-slots";
import styles from "./dashboard.module.css";

export default async function RecruitDashboard() {
  const supabase = await createClient();

  const [config, { data: applicantData }, { data: slotData }] = await Promise.all([
    // 코드에 박힌 기본값이 아니라 지금 설정을 보여줘야 한다
    getRecruitSettings(),
    supabase
      .from("applicants")
      .select("id, student_id, name, track, phone, motivation, applied_at, first_result, interview, final_result, extra, preview")
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
    { no: 1, label: "지원서 접수", date: `${config.applyStart} – ${config.applyEnd}` },
    { no: 2, label: "1차 서류 발표", date: config.firstResultDate },
    { no: 3, label: "대면 면접", date: config.interviewRange },
    { no: 4, label: "최종 발표", date: config.finalResultDate },
  ];

  /*
   * 정원은 "한 타임에 몇 명" 이다. 하루 전체 정원은 (칸 수 × 타임당 정원) 이고,
   * 예약 수는 그 슬롯이 실제로 만들어 낸 시각과 맞춰 센다 — 날짜 앞글자만 보면
   * 같은 날에 슬롯을 둘로 나눠 열었을 때 양쪽이 같은 예약을 겹쳐 센다.
   */
  const slotStats = slots.map((s) => {
    const times = expandSlot(s);
    const labels = new Set(times.map((t) => t.label));
    return {
      slot: s,
      total: times.length * s.capacity,
      count: applicants.filter((a) => a.interview && labels.has(a.interview)).length,
    };
  });

  const seatTotal = slotStats.reduce((sum, x) => sum + x.total, 0);
  // 슬롯을 고친 뒤 남은, 지금은 없는 시각에 잡힌 예약
  const strayCount = bookedCount - slotStats.reduce((sum, x) => sum + x.count, 0);

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

        <Panel title="면접 슬롯 현황" count={`예약 ${bookedCount} / ${seatTotal}`}>
          <div className={styles.progressWrap}>
            {slotStats.map(({ slot, total, count }) => {
              const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
              return (
                <div key={slot.id} className={styles.progressRow}>
                  <div className={styles.progressHead}>
                    <span className={styles.progressLabel}>
                      {slot.slot_date}
                      <span className={styles.progressSub}>{slot.time_range}</span>
                    </span>
                    <span className={styles.progressValue}>
                      {count}/{total}
                    </span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={cn(styles.fill, count >= total && styles.full)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {slots.length === 0 && <p className={ui.muted}>열어둔 면접 슬롯이 없습니다.</p>}
            {strayCount > 0 && (
              <p className={ui.muted}>
                지금 열어둔 시간에 없는 예약 {strayCount}건이 있습니다. 슬롯을 고친 뒤 남은
                예약이니 면접 일정에서 확인해 주세요.
              </p>
            )}
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
