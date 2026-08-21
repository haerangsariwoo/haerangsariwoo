import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { applicants } from "@/lib/admin-data";

export const metadata = { title: "지원자 관리 · 해랑사리우" };

export default function RecruitApplicantsPage() {
  return (
    <Panel
      title="지원자 명단"
      count={`${applicants.length}명`}
      desc="지원 내용을 확인하고 심사 결과를 기록합니다. 명단은 구글 스프레드시트로 바로 내보낼 수 있습니다."
    >
      <div className={ui.toolbar}>
        <input className={ui.search} placeholder="이름 · 학번 검색" aria-label="지원자 검색" />
        <select className={ui.select} defaultValue="all" aria-label="1차 결과 필터">
          <option value="all">1차: 전체</option>
          <option value="pass">합격</option>
          <option value="wait">대기</option>
          <option value="fail">불합격</option>
        </select>
        <select className={ui.select} defaultValue="all" aria-label="학부 필터">
          <option value="all">학부: 전체</option>
          <option value="it">IT공과대</option>
          <option value="design">디자인대</option>
          <option value="social">사회과학대</option>
        </select>
        <span className={ui.spacer} />
        <button type="button" className={cn(ui.btn, ui.sheet)}>
          구글 스프레드시트로 내보내기
        </button>
        <button type="button" className={ui.btn}>
          CSV 다운로드
        </button>
      </div>

      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>학번</th>
              <th>학부 · 트랙</th>
              <th>연락처</th>
              <th>지원 동기</th>
              <th>1차</th>
              <th>면접 시간</th>
              <th>최종</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {applicants.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className={cn(ui.muted, ui.numeric)}>{a.studentId}</td>
                <td className={ui.muted}>{a.track}</td>
                <td className={cn(ui.muted, ui.numeric)}>{a.phone}</td>
                <td className={cn(ui.muted, ui.clip)}>{a.motivation}</td>
                <td>
                  <Badge tone={a.first === "합격" ? "green" : a.first === "불합격" ? "danger" : "grey"}>
                    {a.first}
                  </Badge>
                </td>
                <td className={cn(ui.numeric, !a.interview && ui.muted)}>
                  {a.interview ?? (a.first === "합격" ? "미선택" : "—")}
                </td>
                <td>
                  <Badge tone={a.final === "합격" ? "green" : a.final === "불합격" ? "danger" : "grey"}>
                    {a.final}
                  </Badge>
                </td>
                <td>
                  <button type="button" className={ui.rowBtn}>
                    보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
