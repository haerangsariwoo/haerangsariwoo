import { getExternalVolunteers } from "@/lib/external";
import { getInternalActivities } from "@/lib/volunteers";
import { VolunteerList } from "./VolunteerList";

export const metadata = { title: "봉사 모집 · 해랑사리우" };

// 외부 포털 응답을 반영하기 위해 요청 시점에 렌더링한다 (모듈 내부에서 1시간 캐시)
export const dynamic = "force-dynamic";

/**
 * 국내 포털을 읽는 화면이므로 서울에 못박아 둔다.
 *
 * 처음엔 VMS 가 배포 환경에서만 연결에 실패하는 게("fetch failed") 해외
 * IP 차단 때문인 줄 알았는데, 확인해 보니 이 프로젝트는 이미 서울에서
 * 돌고 있었다(x-vercel-id 가 icn1). 그러니 이 줄은 원인을 고친 게 아니라,
 * 대시보드 기본 리전이 바뀌어도 이 화면만은 안 따라가게 막아 두는 것이다.
 */
export const preferredRegion = ["icn1"];

export default async function VolunteerPage() {
  const [external, internal] = await Promise.all([getExternalVolunteers(), getInternalActivities()]);
  return <VolunteerList external={external} internal={internal} />;
}
