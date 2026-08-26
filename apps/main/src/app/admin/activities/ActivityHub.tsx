"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SubTabs, type SubTab } from "@/components/admin/SubTabs/SubTabs";
import { VolunteerAdmin } from "../volunteers/VolunteerAdmin";
import { ApplicantTable } from "../applicants/ApplicantTable";
import { ActivityAdmin } from "./ActivityAdmin";

const TABS: SubTab[] = [
  { value: "volunteers", label: "봉사활동" },
  { value: "events", label: "동아리 활동" },
  { value: "applicants", label: "신청자" },
];

/**
 * 봉사활동·동아리 활동·신청자는 결국 "이번 학기에 뭘 하고 누가 오는가"
 * 하나를 세 각도에서 보는 화면이라 한 메뉴로 묶었다.
 * ?tab= 으로 바로 들어올 수 있어 대시보드에서 곧장 신청자 탭을 연다.
 */
export function ActivityHub() {
  return (
    <Suspense fallback={<Hub initial="volunteers" />}>
      <FromQuery />
    </Suspense>
  );
}

function FromQuery() {
  const params = useSearchParams();
  const tab = params.get("tab");
  return <Hub initial={TABS.some((t) => t.value === tab) ? tab! : "volunteers"} />;
}

function Hub({ initial }: { initial: string }) {
  const [tab, setTab] = useState(initial);

  return (
    <>
      <SubTabs tabs={TABS} value={tab} onChange={setTab} label="활동 관리 구분" />
      {/* 보고 있는 탭만 그린다 — 안 보는 표까지 조회할 이유가 없다 */}
      {tab === "volunteers" && <VolunteerAdmin />}
      {tab === "events" && <ActivityAdmin />}
      {tab === "applicants" && <ApplicantTable />}
    </>
  );
}
