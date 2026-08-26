import { getExternalVolunteers } from "@/lib/external";
import { getInternalActivities } from "@/lib/volunteers";
import { VolunteerList } from "./VolunteerList";

export const metadata = { title: "봉사 모집 · 해랑사리우" };

// 외부 포털 응답을 반영하기 위해 요청 시점에 렌더링한다 (모듈 내부에서 1시간 캐시)
export const dynamic = "force-dynamic";

/**
 * 국내 포털을 읽는 화면이므로 서울에서 돌린다.
 *
 * VMS(vms.or.kr)는 국내에서 열면 2초에 응답하는데, 미국(iad1)에서는 443
 * 포트 연결이 10초 내내 아무 대답 없이 끊긴다(UND_ERR_CONNECT_TIMEOUT).
 * 거부가 아니라 무응답이라는 건 방화벽이 패킷을 버린다는 뜻이고, 국내
 * 기관 사이트가 해외 IP 를 막는 흔한 방식이다.
 *
 * 주의: 이 줄만으로는 부족하다. Hobby 요금제는 프로젝트 전체가 한 리전을
 * 쓰므로, Vercel 프로젝트 설정의 Function Region 도 서울로 맞춰야 한다.
 * x-vercel-id 앞자리는 요청이 들어온 엣지 지역이라 실행 지역이 아니다 —
 * 실행 지역은 /api/health 의 region 으로 확인한다.
 */
export const preferredRegion = ["icn1"];

export default async function VolunteerPage() {
  const [external, internal] = await Promise.all([getExternalVolunteers(), getInternalActivities()]);
  return <VolunteerList external={external} internal={internal} />;
}
