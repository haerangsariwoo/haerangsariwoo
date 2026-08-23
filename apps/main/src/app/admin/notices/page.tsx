import { Panel } from "@/components/admin/Panel/Panel";
import { notices } from "@/lib/community";
import { NoticeTable } from "./NoticeTable";

export const metadata = { title: "공지 알림 · 해랑사리우" };

export default function AdminNoticesPage() {
  return (
    <Panel
      title="공지·알림"
      count={`${notices.length}건`}
      desc="부원 커뮤니티에 노출되는 공지입니다."
    >
      <NoticeTable />
    </Panel>
  );
}
