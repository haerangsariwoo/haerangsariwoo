import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { applicants } from "@/lib/admin-data";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "신청자·대기자 · 해랑사리우" };

const STATE_TONE: Record<string, BadgeTone> = {
  참여확정: "green",
  신청완료: "blue",
  대기: "orange",
  불참: "grey",
  노쇼: "grey",
};

export default function AdminApplicantsPage() {
  return (
    <Panel
      title="신청자·대기자 관리"
      count={`${applicants.length}명`}
      desc="참여 여부는 활동 종료 후 운영진이 직접 처리합니다."
    >
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="이름·학번 검색" aria-label="신청자 검색" />
        <select className={toolbar.select} defaultValue="all" aria-label="봉사 필터">
          <option value="all">봉사: 전체</option>
          <option value="v3">아동센터 교육 봉사</option>
          <option value="v1">한강 플로깅</option>
        </select>
        <select className={toolbar.select} defaultValue="all" aria-label="상태 필터">
          <option value="all">상태: 전체</option>
          <option value="confirmed">참여확정</option>
          <option value="applied">신청완료</option>
          <option value="wait">대기</option>
        </select>
        <span className={toolbar.spacer} />
        <button type="button" className={toolbar.button}>
          일괄 참여확정
        </button>
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          출석 처리
        </button>
      </div>

      <DataTable columns={["이름", "학번", "기수", "신청 봉사", "신청일", "상태", ""]}>
        {applicants.map((a) => (
          <tr key={a.id}>
            <td>{a.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.studentId}</td>
            <td className={tableStyles.muted}>{a.cohort}</td>
            <td className={tableStyles.muted}>{a.volunteer}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.appliedAt}</td>
            <td>
              <Badge tone={STATE_TONE[a.state]}>
                {a.state}
                {a.waitNo ? ` ${a.waitNo}번` : ""}
              </Badge>
            </td>
            <td>
              <RowAction primary={a.state === "대기"}>
                {a.state === "대기" ? "승격" : "변경"}
              </RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
