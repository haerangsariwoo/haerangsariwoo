import { Panel } from "@/components/admin/Panel/Panel";
import { hourRequests } from "@/lib/admin-data";
import { HourTable } from "./HourTable";

export const metadata = { title: "봉사시간 승인 · 해랑사리우" };

export default function AdminHoursPage() {
  const pending = hourRequests.filter((h) => h.state === "대기");

  return (
    <Panel
      title="봉사시간 승인"
      count={`대기 ${pending.length}건`}
      desc="부원이 제출한 증빙을 확인하고 실적을 업로드하면 마이페이지에 반영됩니다."
    >
      <HourTable />
    </Panel>
  );
}
