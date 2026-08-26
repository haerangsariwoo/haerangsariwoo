import { Panel } from "@/components/admin/Panel/Panel";
import { getAppContent } from "@/lib/app-content-queries";
import { HomeCopyPanel, FaqPanel, NoticeCopyPanel } from "./ContentPanels";
import { AlbumPanel } from "./AlbumPanel";

export const metadata = { title: "콘텐츠 관리 · 해랑사리우" };

export default async function AdminContentPage() {
  const content = await getAppContent();

  return (
    <>
      <Panel title="홈 화면 문구" desc="부원이 앱을 열었을 때 가장 먼저 보는 인사말입니다.">
        <HomeCopyPanel content={content} />
      </Panel>

      <Panel
        title="자주 묻는 질문 (Q&A)"
        count={`${content.faqs.length}개`}
        desc="부원이 자주 묻는 내용을 정리합니다. 마이페이지와 쪽지함에서 확인할 수 있어요."
      >
        <FaqPanel content={content} />
      </Panel>

      <Panel
        title="화면 안내 문구"
        count={`${content.noticeCopies.length}개`}
        desc="각 화면 하단에 표시되는 안내입니다. 운영 방식이 바뀌면 함께 수정해 주세요."
      >
        <NoticeCopyPanel content={content} />
      </Panel>

      <AlbumPanel />
    </>
  );
}
