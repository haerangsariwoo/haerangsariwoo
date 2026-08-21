import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "활동 기록 · 해랑사리우" };

export default function RecordsPage() {
  return (
    <SpecScreen
      title="활동 기록"
      status="정상"
      blocks={[
        { title: "신청완료 · 참여확정", desc: "예정된 활동의 신청 상태를 확인합니다." },
        { title: "대기 순번 · 취소", desc: "대기 중인 신청과 취소 내역" },
        { title: "마감 · 활동완료 · 불참", desc: "지난 활동의 최종 처리 결과" },
      ]}
      note="참여 여부는 운영진이 신청자 관리에서 확인·처리합니다"
      action={{ label: "MY로 돌아가기", href: "/my" }}
    />
  );
}
