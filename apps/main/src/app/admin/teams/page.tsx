import { Panel } from "@/components/admin/Panel/Panel";
import { TeamEventManager } from "./TeamEventManager";

export const metadata = { title: "팀짜기 · 해랑사리우" };

export default function AdminTeamsPage() {
  return (
    <>
      <Panel
        title="팀짜기"
        desc="행사를 고르고 참여 인원을 정한 뒤, 이름을 끌어다 놓으면 조가 바뀝니다. 눌러서 고른 뒤 옮길 조를 눌러도 됩니다."
      >
        <TeamEventManager />
      </Panel>
    </>
  );
}
