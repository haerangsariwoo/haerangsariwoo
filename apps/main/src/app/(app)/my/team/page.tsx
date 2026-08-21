import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "내 조 · 해랑사리우" };

export default function TeamPage() {
  return (
    <SpecScreen
      title="내 조"
      status="MT 3조"
      blocks={[
        { title: "행사 정보", desc: "제26회 MT · 일시 · 장소" },
        { title: "조원 명단", desc: "조장 포함 6명 · 조회만 가능합니다." },
        { title: "편성 안내", desc: "조 편성은 운영진이 진행하며 부원은 결과만 확인합니다." },
      ]}
      note="발행된 조만 표시됩니다 · 편성 전에는 홈에서 숨겨집니다"
      action={{ label: "홈으로", href: "/home" }}
    />
  );
}
