import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { hourRequests } from "@/lib/admin-data";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "봉사시간 승인 · 해랑사리우" };

const STATE_TONE: Record<string, BadgeTone> = {
  대기: "orange",
  승인: "green",
  반려: "grey",
};

export default function AdminHoursPage() {
  const pending = hourRequests.filter((h) => h.state === "대기");

  return (
    <Panel
      title="봉사시간 승인"
      count={`대기 ${pending.length}건`}
      desc="부원이 제출한 증빙을 확인하고 실적을 업로드하면 마이페이지에 반영됩니다."
    >
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="이름·봉사명 검색" aria-label="승인 검색" />
        <select className={toolbar.select} defaultValue="pending" aria-label="상태 필터">
          <option value="pending">상태: 대기</option>
          <option value="all">전체</option>
          <option value="approved">승인</option>
          <option value="rejected">반려</option>
        </select>
        <span className={toolbar.spacer} />
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          선택 항목 일괄 승인
        </button>
      </div>

      <DataTable columns={["이름", "학번", "봉사활동", "활동일", "신청 시간", "증빙", "상태", ""]}>
        {hourRequests.map((h) => (
          <tr key={h.id}>
            <td>{h.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{h.studentId}</td>
            <td className={tableStyles.muted}>{h.volunteer}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{h.date}</td>
            <td className={tableStyles.numeric}>{h.hours}시간</td>
            <td className={tableStyles.muted}>{h.proof}</td>
            <td>
              <Badge tone={STATE_TONE[h.state]}>{h.state}</Badge>
            </td>
            <td>
              <RowAction primary={h.state === "대기"}>
                {h.state === "대기" ? "검토" : "보기"}
              </RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
