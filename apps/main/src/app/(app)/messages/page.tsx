import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "쪽지함 · 해랑사리우" };

export default function MessagesPage() {
  return (
    <SpecScreen
      title="쪽지함"
      status="정상"
      blocks={[
        { title: "운영진 쪽지함", desc: "운영진이 보낸 안내 쪽지를 확인합니다." },
        { title: "채널톡 익명 문의", desc: "운영진에게 익명으로 문의할 수 있습니다." },
        { title: "개인 연락처 비노출", desc: "개인 연락처 대신 공식 채널을 이용합니다." },
      ]}
      note="익명 문의는 채널톡 위젯으로 연결됩니다"
      action={{ label: "홈으로", href: "/home" }}
    />
  );
}
