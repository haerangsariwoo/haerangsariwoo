import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "활동 · 해랑사리우" };

export default function ActivitiesPage() {
  return (
    <SpecScreen
      title="활동"
      status="정상"
      blocks={[
        {
          title: "유형 필터: 파티·MT·친목·총회",
          desc: "동아리 자체 행사만 모아봅니다. 봉사와는 분리돼 있어요.",
        },
        {
          title: "다가오는 활동",
          desc: "일시 · 장소 · 참여 대상 · 참석 여부",
        },
        {
          title: "월간 캘린더 전환",
          desc: "유형별 색 구분으로 한 달 일정을 확인합니다.",
        },
      ]}
      note="브리핑 조건 반영 · 일정은 관리자 설정값"
      action={{ label: "활동 캘린더 열기", href: "/calendar" }}
    />
  );
}
