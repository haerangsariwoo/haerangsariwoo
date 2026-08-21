import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "봉사 인증 · 해랑사리우" };

export default function VerifyPage() {
  return (
    <SpecScreen
      title="봉사 인증"
      status="정상"
      blocks={[
        { title: "사진·증빙 첨부", desc: "활동 사진이나 확인 자료를 첨부합니다." },
        { title: "인정시간 신청", desc: "참여한 봉사와 인정 시간을 입력합니다." },
        { title: "운영진 승인 대기", desc: "운영진이 검토 후 실적을 업로드하면 반영됩니다." },
      ]}
      note="승인된 실적만 MY 페이지 봉사시간에 반영됩니다"
      action={{ label: "홈으로", href: "/home" }}
    />
  );
}
