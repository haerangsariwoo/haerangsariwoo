import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { notices } from "@/lib/community";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "공지·알림 · 해랑사리우" };

export default function AdminNoticesPage() {
  return (
    <Panel title="공지·알림" count={`${notices.length}건`} desc="부원 커뮤니티에 노출되는 공지입니다.">
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="제목 검색" aria-label="공지 검색" />
        <select className={toolbar.select} defaultValue="all" aria-label="카테고리 필터">
          <option value="all">카테고리: 전체</option>
          <option value="urgent">필독</option>
          <option value="schedule">일정</option>
          <option value="review">후기</option>
        </select>
        <span className={toolbar.spacer} />
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          ＋ 공지 작성
        </button>
      </div>

      <DataTable columns={["카테고리", "제목", "작성자", "작성일", "상단 고정", ""]}>
        {notices.map((n) => (
          <tr key={n.id}>
            <td>
              <Badge tone={n.category === "필독" ? "orange" : "blue"}>{n.category}</Badge>
            </td>
            <td>{n.title}</td>
            <td className={tableStyles.muted}>{n.author}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{n.date}</td>
            <td>{n.pinned ? <Badge tone="green">고정</Badge> : <span className={tableStyles.muted}>—</span>}</td>
            <td>
              <RowAction>수정</RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
