import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { NoticeComposer } from "@/components/admin/NoticeComposer/NoticeComposer";
import { notices } from "@/lib/community";

export const metadata = { title: "공지·알림 · 해랑사리우" };

export default function AdminNoticesPage() {
  return (
    <Panel title="공지·알림" count={`${notices.length}건`} desc="부원 커뮤니티에 노출되는 공지입니다.">
      <NoticeComposer />

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
