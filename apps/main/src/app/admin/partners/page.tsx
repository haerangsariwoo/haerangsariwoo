import { Panel } from "@/components/admin/Panel/Panel";
import { partners } from "@/lib/admin-data";
import { PartnerTable } from "./PartnerTable";

export const metadata = { title: "협력기관 · 해랑사리우" };

export default function AdminPartnersPage() {
  return (
    <Panel title="협력기관" count={`${partners.length}곳`}>
      <PartnerTable />
    </Panel>
  );
}
