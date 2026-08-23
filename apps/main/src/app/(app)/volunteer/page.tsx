import { getExternalVolunteers } from "@/lib/external";
import { VolunteerList } from "./VolunteerList";

export const metadata = { title: "봉사 모집 · 해랑사리우" };

// 외부 포털 응답을 반영하기 위해 요청 시점에 렌더링한다 (모듈 내부에서 1시간 캐시)
export const dynamic = "force-dynamic";

export default async function VolunteerPage() {
  const external = await getExternalVolunteers();
  return <VolunteerList external={external} />;
}
