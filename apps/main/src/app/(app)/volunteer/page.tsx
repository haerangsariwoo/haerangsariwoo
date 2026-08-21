import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "봉사 모집 · 해랑사리우" };

export default function VolunteerPage() {
  return (
    <SpecScreen
      title="봉사 모집"
      status="정상"
      blocks={[
        {
          title: "환경·교육·복지 필터",
          desc: "카테고리 칩으로 원하는 봉사를 골라봅니다.",
        },
        {
          title: "마감임박 정렬",
          desc: "남은 자리와 마감일 기준으로 정렬됩니다.",
        },
        {
          title: "내부·1365·VMS 배지",
          desc: "내부 봉사는 앱에서 신청, 외부는 원본 사이트로 이동합니다.",
        },
      ]}
      note="브리핑 조건 반영 · 외부 봉사는 1365/VMS 크롤링 노출"
      action={{ label: "봉사 캘린더 보기", href: "/calendar" }}
    />
  );
}
