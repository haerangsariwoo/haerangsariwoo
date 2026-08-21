import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "MY · 해랑사리우" };

export default function MyPage() {
  return (
    <SpecScreen
      title="MY"
      status="정상"
      blocks={[
        { title: "프로필 · 기수 정보", desc: "이름 · 학번 · 기수" },
        { title: "누적 시간·출석률·배지", desc: "이번 학기와 누적 활동을 함께 확인합니다." },
        {
          title: "신청·활동기록·증명자료",
          desc: "신청 내역과 활동 기록, 활동확인서를 확인합니다.",
          href: "/my/records",
        },
      ]}
      note="봉사시간은 운영진이 승인·업로드한 실적만 반영됩니다"
      action={{ label: "활동 기록 보기", href: "/my/records" }}
    />
  );
}
