import { Panel } from "@/components/admin/Panel/Panel";
import { boardPosts } from "@/lib/admin-data";
import { BoardTable } from "./BoardTable";

export const metadata = { title: "운영진 게시판 · 해랑사리우" };

export default function AdminBoardPage() {
  return (
    <Panel
      title="운영진 게시판"
      count={`${boardPosts.length}건`}
      desc="회의록과 운영 자료를 기록해 다음 기수로 인수인계합니다. 운영진만 열람할 수 있습니다."
    >
      <BoardTable />
    </Panel>
  );
}
