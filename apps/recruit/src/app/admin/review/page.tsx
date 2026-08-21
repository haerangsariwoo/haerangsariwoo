import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { applicants } from "@/lib/admin-data";

export const metadata = { title: "심사 · 해랑사리우" };

export default function RecruitReviewPage() {
  const firstPending = applicants.filter((a) => a.first === "대기");
  const finalPending = applicants.filter((a) => a.first === "합격" && a.final === "대기");

  return (
    <>
      <Panel
        title="1차 서류 심사"
        count={`대기 ${firstPending.length}명`}
        desc="지원서를 확인하고 합격 여부를 기록합니다. 발표 전까지 지원자에게 공개되지 않습니다."
      >
        <div className={ui.toolbar}>
          <input className={ui.search} placeholder="이름 검색" aria-label="심사 검색" />
          <span className={ui.spacer} />
          <button type="button" className={ui.btn}>
            선택 일괄 불합격
          </button>
          <button type="button" className={cn(ui.btn, ui.primary)}>
            선택 일괄 합격
          </button>
        </div>

        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>학번</th>
                <th>학부 · 트랙</th>
                <th>지원 동기</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.studentId}</td>
                  <td className={ui.muted}>{a.track}</td>
                  <td className={cn(ui.muted, ui.clip)}>{a.motivation}</td>
                  <td>
                    <Badge tone={a.first === "합격" ? "green" : a.first === "불합격" ? "danger" : "grey"}>
                      {a.first}
                    </Badge>
                  </td>
                  <td>
                    <button type="button" className={ui.rowBtn}>
                      심사
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="최종 심사 · 발표"
        count={`대기 ${finalPending.length}명`}
        desc="면접을 마친 지원자의 최종 결과를 확정하고 발표합니다."
      >
        <div className={ui.toolbar}>
          <span className={ui.spacer} />
          <button type="button" className={ui.btn}>
            1차 결과 발표
          </button>
          <button type="button" className={cn(ui.btn, ui.primary)}>
            최종 결과 발표
          </button>
        </div>

        <p className={ui.desc}>
          발표하면 지원자가 학번과 본인 지정번호로 로그인해 결과를 확인할 수 있습니다. 불합격
          안내에는 별도 문의 채널을 노출하지 않습니다.
        </p>
      </Panel>
    </>
  );
}
