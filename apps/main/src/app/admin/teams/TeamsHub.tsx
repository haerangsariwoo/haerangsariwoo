"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Panel } from "@/components/admin/Panel/Panel";
import { SubTabs, type SubTab } from "@/components/admin/SubTabs/SubTabs";
import { TeamEventManager } from "./TeamEventManager";
import { TableShuffle } from "./TableShuffle";

const TABS: SubTab[] = [
  { value: "teams", label: "팀짜기" },
  { value: "tables", label: "테이블 섞기" },
];

/**
 * 행사 조 편성(서버에 저장·발행)과 모임 자리 섞기(이 기기에만 저장)를
 * 한 메뉴에 둔다. ?tab=tables 로 테이블 섞기를 바로 연다.
 */
export function TeamsHub() {
  return (
    <Suspense fallback={<Hub initial="teams" />}>
      <FromQuery />
    </Suspense>
  );
}

function FromQuery() {
  const tab = useSearchParams().get("tab");
  return <Hub initial={TABS.some((t) => t.value === tab) ? tab! : "teams"} />;
}

function Hub({ initial }: { initial: string }) {
  const [tab, setTab] = useState(initial);

  return (
    <>
      <SubTabs tabs={TABS} value={tab} onChange={setTab} label="팀짜기 구분" />
      {tab === "teams" && (
        <Panel
          title="팀짜기"
          desc="행사를 고르고 참여 인원을 정한 뒤, 이름을 끌어다 놓으면 조가 바뀝니다. 눌러서 고른 뒤 옮길 조를 눌러도 됩니다."
        >
          <TeamEventManager />
        </Panel>
      )}
      {tab === "tables" && (
        <Panel
          title="테이블 섞기"
          desc="테이블마다 앉은 사람을 적고 성별과 운영진을 정한 뒤 섞기를 누르세요."
        >
          <TableShuffle />
        </Panel>
      )}
    </>
  );
}
