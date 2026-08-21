import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "활동 앨범 · 해랑사리우" };

export default function AlbumPage() {
  return (
    <SpecScreen
      title="활동 앨범"
      status="정상"
      blocks={[
        { title: "활동별 사진 그리드", desc: "봉사 · 친목 · MT 활동 사진을 모아봅니다." },
        { title: "앨범 상세", desc: "사진과 간단한 설명을 함께 확인합니다." },
        { title: "앱 내부 콘텐츠", desc: "인스타그램 임베드가 아닌 앱 자체 콘텐츠입니다." },
      ]}
      note="사진은 운영진이 활동앨범 관리에서 업로드합니다"
      action={{ label: "커뮤니티로 돌아가기", href: "/community" }}
    />
  );
}
