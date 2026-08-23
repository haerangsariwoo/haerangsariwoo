import { Panel } from "@/components/admin/Panel/Panel";
import { adminVolunteers } from "@/lib/admin-data";
import { VolunteerAdmin } from "./VolunteerAdmin";

export const metadata = { title: "봉사활동 관리 · 해랑사리우" };

export default function AdminVolunteersPage() {
  return (
    <Panel title="봉사활동 목록" count={`${adminVolunteers.length}건`}>
      <VolunteerAdmin />
    </Panel>
  );
}
