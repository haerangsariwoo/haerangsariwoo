import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { partners } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "협력기관 · 해랑사리우" };

export default function AdminPartnersPage() {
  return (
    <Panel title="협력기관" count={`${partners.length}곳`}>
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="기관명 검색" aria-label="기관 검색" />
        <span className={toolbar.spacer} />
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          ＋ 기관 등록
        </button>
      </div>

      <DataTable columns={["기관명", "연락처", "누적 활동", "협력 시작", ""]}>
        {partners.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.contact}</td>
            <td className={tableStyles.numeric}>{p.activities}회</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.since}년</td>
            <td>
              <RowAction>수정</RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
