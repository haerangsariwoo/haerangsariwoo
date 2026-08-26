import { getExternalVolunteers } from "@/lib/external";
import { getInternalActivities } from "@/lib/volunteers";
import { VolunteerList } from "./VolunteerList";

export const metadata = { title: "봉사 모집 · 해랑사리우" };

// 외부 포털 응답을 반영하기 위해 요청 시점에 렌더링한다 (모듈 내부에서 1시간 캐시)
export const dynamic = "force-dynamic";

/**
 * 이 화면만 서울에서 돌린다.
 *
 * VMS(vms.or.kr)는 국내에서 열면 0.2초에 응답하는데 배포 환경에서는 연결
 * 자체가 실패했다("fetch failed"). 국내 기관 사이트가 해외 IP 를 막는 일은
 * 흔하고, Vercel 은 따로 정하지 않으면 미국에서 돈다.
 *
 * 여기만 옮기는 이유는, 다른 화면은 지금 잘 돌고 있어 굳이 건드릴 이유가
 * 없기 때문이다. 이 화면은 어차피 국내 포털을 읽으니 서울이 제자리다.
 */
export const preferredRegion = ["icn1"];

export default async function VolunteerPage() {
  const [external, internal] = await Promise.all([getExternalVolunteers(), getInternalActivities()]);
  return <VolunteerList external={external} internal={internal} />;
}
