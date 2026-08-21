import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { boardPosts } from "@/lib/admin-data";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "운영진 게시판 · 해랑사리우" };

const CAT_TONE: Record<string, BadgeTone> = {
  회의록: "blue",
  "운영 공지": "orange",
  자료: "green",
  자유: "grey",
};

export default function AdminBoardPage() {
  return (
    <Panel
      title="운영진 게시판"
      count={`${boardPosts.length}건`}
      desc="회의록과 운영 자료를 기록해 다음 기수로 인수인계합니다. 운영진만 열람할 수 있습니다."
    >
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="제목·작성자 검색" aria-label="게시글 검색" />
        <select className={toolbar.select} defaultValue="all" aria-label="카테고리 필터">
          <option value="all">카테고리: 전체</option>
          <option value="minutes">회의록</option>
          <option value="notice">운영 공지</option>
          <option value="file">자료</option>
          <option value="free">자유</option>
        </select>
        <span className={toolbar.spacer} />
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          ＋ 글 작성
        </button>
      </div>

      <DataTable columns={["카테고리", "제목", "작성자", "작성일", "첨부", ""]}>
        {boardPosts.map((p) => (
          <tr key={p.id}>
            <td>
              <Badge tone={CAT_TONE[p.category]}>{p.category}</Badge>
            </td>
            <td>{p.title}</td>
            <td className={tableStyles.muted}>{p.author}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{p.date}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>
              {p.files > 0 ? `${p.files}개` : "—"}
            </td>
            <td>
              <RowAction>열기</RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
