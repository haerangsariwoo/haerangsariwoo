import { Panel } from "@/components/admin/Panel/Panel";
import { applicants } from "@/lib/admin-data";
import { ApplicantTable } from "./ApplicantTable";

export const metadata = { title: "신청자 관리 · 해랑사리우" };

export default function AdminApplicantsPage() {
  return (
    <Panel
      title="신청자·대기자 관리"
      count={`${applicants.length}명`}
      desc="참여 여부는 활동 종료 후 운영진이 직접 처리합니다."
    >
      <ApplicantTable />
    </Panel>
  );
}
