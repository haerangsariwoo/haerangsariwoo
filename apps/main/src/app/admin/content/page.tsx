import { Panel } from "@/components/admin/Panel/Panel";
import { memberFaqs, noticeCopies } from "@/lib/app-content";
import { albums } from "@/lib/community";
import { HomeCopyPanel, FaqPanel, NoticeCopyPanel, AlbumPanel } from "./ContentPanels";

export const metadata = { title: "콘텐츠 관리 · 해랑사리우" };

export default function AdminContentPage() {
  return (
    <>
      <Panel title="홈 화면 문구" desc="부원이 앱을 열었을 때 가장 먼저 보는 인사말입니다.">
        <HomeCopyPanel />
      </Panel>

      <Panel
        title="자주 묻는 질문 (Q&A)"
        count={`${memberFaqs.length}개`}
        desc="부원이 자주 묻는 내용을 정리합니다. 마이페이지와 쪽지함에서 확인할 수 있어요."
      >
        <FaqPanel />
      </Panel>

      <Panel
        title="화면 안내 문구"
        count={`${noticeCopies.length}개`}
        desc="각 화면 하단에 표시되는 안내입니다. 운영 방식이 바뀌면 함께 수정해 주세요."
      >
        <NoticeCopyPanel />
      </Panel>

      <Panel
        title="활동 사진 (앨범)"
        count={`${albums.length}개`}
        desc="커뮤니티 앨범과 홈 화면에 노출되는 사진입니다."
      >
        <AlbumPanel />
      </Panel>
    </>
  );
}
