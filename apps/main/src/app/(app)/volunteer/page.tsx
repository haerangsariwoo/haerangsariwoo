import { getExternalVolunteers } from "@/lib/external";
import { getInternalActivities } from "@/lib/volunteers";
import { VolunteerList } from "./VolunteerList";

export const metadata = { title: "봉사 모집 · 해랑사리우" };

// 외부 포털 응답을 반영하기 위해 요청 시점에 렌더링한다 (모듈 내부에서 1시간 캐시)
export const dynamic = "force-dynamic";

/*
 * 리전을 여기서 지정하지 않는다.
 *
 * VMS(vms.or.kr)는 미국에서 열면 443 포트가 10초 내내 무응답으로 끊긴다
 * (UND_ERR_CONNECT_TIMEOUT). 그래서 서울에서 돌려야 하는데, 그 설정은
 * Vercel 프로젝트의 Function Region 에 있다 (지금 icn1).
 *
 * 한때 이 자리에 preferredRegion = ["icn1"] 을 뒀다가 오히려 이 화면만
 * iad1 로 떨어졌다. Hobby 요금제는 라우트별 리전을 지원하지 않아서,
 * 지정이 있으면 프로젝트 설정 대신 플랫폼 기본값으로 밀려나는 것으로
 * 보인다. 다른 화면은 다 icn1 인데 이 화면만 iad1 이었던 게 근거다.
 */

export default async function VolunteerPage() {
  const [external, internal] = await Promise.all([getExternalVolunteers(), getInternalActivities()]);
  return <VolunteerList external={external} internal={internal} />;
}
