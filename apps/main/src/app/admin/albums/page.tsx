import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { albums } from "@/lib/community";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "활동앨범 · 해랑사리우" };

export default function AdminAlbumsPage() {
  return (
    <Panel
      title="활동앨범"
      count={`${albums.length}개`}
      desc="업로드한 사진은 부원 커뮤니티의 앨범 탭에 노출됩니다."
    >
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="앨범명 검색" aria-label="앨범 검색" />
        <span className={toolbar.spacer} />
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          ＋ 앨범 만들기
        </button>
      </div>

      <DataTable columns={["앨범명", "활동일", "사진", ""]}>
        {albums.map((a) => (
          <tr key={a.id}>
            <td>{a.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.date}</td>
            <td className={tableStyles.numeric}>{a.photoCount}장</td>
            <td>
              <RowAction primary>사진 업로드</RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
