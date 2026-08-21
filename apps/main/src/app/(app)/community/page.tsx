import { SpecScreen } from "@/components/layout/SpecScreen/SpecScreen";

export const metadata = { title: "커뮤니티 · 해랑사리우" };

export default function CommunityPage() {
  return (
    <SpecScreen
      title="커뮤니티"
      status="정상"
      blocks={[
        {
          title: "중요 공지 상단 고정",
          desc: "필독 공지가 목록 맨 위에 고정됩니다.",
        },
        {
          title: "공지 목록·상세",
          desc: "공지 카테고리 · 작성일 · 상세 보기",
        },
        {
          title: "활동 앨범",
          desc: "활동별 사진 그리드 · 앨범 상세",
          href: "/community/album",
        },
      ]}
      note="공지와 앨범만 제공 · 자유게시판·실시간 채팅은 범위 아님"
      action={{ label: "앨범 보기", href: "/community/album" }}
    />
  );
}
