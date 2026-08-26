"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SubTabs, type SubTab } from "@/components/admin/SubTabs/SubTabs";
import { NoticeTable } from "../notices/NoticeTable";
import { MessageSender } from "./MessageSender";

const TABS: SubTab[] = [
  { value: "notices", label: "공지" },
  { value: "messages", label: "쪽지" },
];

/**
 * 공지와 쪽지는 둘 다 "부원에게 알리는 일" 이라 한 메뉴에 둔다.
 * 공지는 커뮤니티에 남는 글이고 쪽지는 각자 쪽지함으로 가는 안내라,
 * 어느 쪽으로 보낼지 고르는 자리가 이 탭이다.
 */
export function MessengerHub() {
  return (
    <Suspense fallback={<Hub initial="notices" />}>
      <FromQuery />
    </Suspense>
  );
}

function FromQuery() {
  const params = useSearchParams();
  const tab = params.get("tab");
  return <Hub initial={TABS.some((t) => t.value === tab) ? tab! : "notices"} />;
}

function Hub({ initial }: { initial: string }) {
  const [tab, setTab] = useState(initial);

  return (
    <>
      <SubTabs tabs={TABS} value={tab} onChange={setTab} label="메신저 구분" />
      {tab === "notices" && <NoticeTable />}
      {tab === "messages" && <MessageSender />}
    </>
  );
}
