import { Panel } from "@/components/admin/Panel";
import { applicants } from "@/lib/admin-data";
import { ApplicantTable } from "./ApplicantTable";

export const metadata = { title: "지원자 관리 · 해랑사리우" };

export default function RecruitApplicantsPage() {
  return (
    <Panel
      title="지원자 명단"
      count={`${applicants.length}명`}
      desc="배지를 눌러 심사 결과를 바꿉니다. 명단은 CSV 로 내보낼 수 있습니다."
    >
      <ApplicantTable />
    </Panel>
  );
}
