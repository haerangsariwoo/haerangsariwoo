import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { applicants, slotRows } from "@/lib/admin-data";

export const metadata = { title: "면접 일정 · 해랑사리우" };

export default function RecruitInterviewsPage() {
  const booked = applicants.filter((a) => a.interview);
  const unbooked = applicants.filter((a) => a.first === "합격" && !a.interview);

  return (
    <>
      <Panel
        title="면접 슬롯 관리"
        count={`${slotRows.length}일`}
        desc="날짜와 시간대를 열어두면 1차 합격자가 직접 예약합니다."
      >
        <div className={ui.toolbar}>
          <span className={ui.spacer} />
          <button type="button" className={cn(ui.btn, ui.primary)}>
            ＋ 슬롯 추가
          </button>
        </div>

        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>운영 시간</th>
                <th>간격</th>
                <th>예약 / 정원</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {slotRows.map((s) => {
                const full = s.booked >= s.capacity;
                return (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td className={cn(ui.muted, ui.numeric)}>{s.range}</td>
                    <td className={ui.muted}>{s.interval}</td>
                    <td className={ui.numeric}>
                      {s.booked} / {s.capacity}
                    </td>
                    <td>
                      <Badge tone={full ? "danger" : "green"}>{full ? "마감" : "예약 가능"}</Badge>
                    </td>
                    <td>
                      <button type="button" className={ui.rowBtn}>
                        수정
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="예약 현황"
        count={`${booked.length}명 예약`}
        desc={`미예약 ${unbooked.length}명 — 필요 시 운영진이 직접 배정할 수 있습니다.`}
      >
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>학번</th>
                <th>연락처</th>
                <th>면접 시간</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...booked, ...unbooked].map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.studentId}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.phone}</td>
                  <td className={ui.numeric}>
                    {a.interview ?? <Badge tone="warn">미선택</Badge>}
                  </td>
                  <td>
                    <button type="button" className={ui.rowBtn}>
                      {a.interview ? "재배정" : "배정"}
                    </button>
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
