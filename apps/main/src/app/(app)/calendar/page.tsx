import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "봉사 캘린더 · 해랑사리우" };

export default function CalendarPage() {
  return (
    <SpecScreen
      title="봉사 캘린더"
      status="정상"
      blocks={[
        { title: "봉사·친목·MT·회의 색 구분", desc: "유형별 색으로 일정을 구분합니다." },
        { title: "내 신청 일정", desc: "신청·확정된 일정만 따로 볼 수 있습니다." },
        { title: "월간 · 일정 상세", desc: "월간 보기에서 날짜를 눌러 상세를 확인합니다." },
      ]}
      note="봉사와 동아리 활동을 한 캘린더에서 함께 확인합니다"
      action={{ label: "홈으로", href: "/home" }}
    />
  );
}
