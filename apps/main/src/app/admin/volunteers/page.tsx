import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { adminVolunteers } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "봉사활동 관리 · 해랑사리우" };

export default function AdminVolunteersPage() {
  return (
    <Panel title="봉사활동 목록" count={`${adminVolunteers.length}건`}>
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="봉사명·장소 검색" aria-label="봉사 검색" />
        <select className={toolbar.select} defaultValue="all" aria-label="출처 필터">
          <option value="all">출처: 전체</option>
          <option value="internal">내부</option>
          <option value="1365">1365</option>
          <option value="vms">VMS</option>
        </select>
        <select className={toolbar.select} defaultValue="all" aria-label="상태 필터">
          <option value="all">상태: 전체</option>
          <option value="open">모집 중</option>
          <option value="closed">모집 마감</option>
        </select>
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          ＋ 봉사활동 만들기
        </button>
      </div>

      <DataTable
        columns={["봉사활동", "일시", "장소", "신청/정원", "인정시간", "출처", "상태", ""]}
      >
        {adminVolunteers.map((v) => (
          <tr key={v.id}>
            <td>{v.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{v.date}</td>
            <td className={tableStyles.muted}>{v.place}</td>
            <td className={tableStyles.numeric}>
              {v.applied} / {v.capacity}
            </td>
            <td className={tableStyles.numeric}>{v.creditHours}시간</td>
            <td>
              <Badge tone={v.source === "내부" ? "blue" : "grey"}>{v.source}</Badge>
            </td>
            <td>
              <Badge tone={v.tone}>{v.status}</Badge>
            </td>
            <td>
              <RowAction>관리</RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
