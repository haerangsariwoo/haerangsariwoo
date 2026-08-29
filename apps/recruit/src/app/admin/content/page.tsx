import Link from "next/link";
import { Panel } from "@/components/admin/Panel";
import { getLandingContent } from "@/lib/content-queries";
import styles from "@/components/admin/ContentEditor.module.css";
import {
  HeroSlidesPanel,
  AboutPanel,
  ActivityCardsPanel,
  RecruitingPanel,
  FaqPanel,
  FooterPanel,
  ApplyProcessPanel,
} from "./ContentPanels";

export const metadata = { title: "콘텐츠 관리 · 해랑사리우" };

export default async function RecruitContentPage() {
  const content = await getLandingContent();

  return (
    <>
      <Panel
        title="히어로 슬라이더"
        count={`${content.heroSlides.length}장`}
        desc="랜딩 최상단에서 자동으로 넘어가는 사진입니다. 사진마다 제목과 부제를 따로 관리합니다. 모바일용 사진을 넣지 않으면 PC 사진의 비율을 조정해 들어갑니다."
      >
        <HeroSlidesPanel content={content} />
      </Panel>

      <Panel title="소개 (About)" desc="동아리를 설명하는 한 단락과 사진, 연도 사실입니다.">
        <AboutPanel content={content} />
      </Panel>

      <Panel
        title="활동 카드"
        count={`${content.activityCards.length}개`}
        desc="랜딩 Activities 영역입니다. 사진을 누르면 크게 볼 수 있으므로 원본 화질로 올려주세요."
      >
        <ActivityCardsPanel content={content} />
      </Panel>

      <Panel title="모집 안내 (Recruiting)" desc="지원 자격 안내와 마무리 문구입니다.">
        <RecruitingPanel content={content} />
      </Panel>

      <Panel
        title="자주 묻는 질문 (Q&A)"
        count={`${content.faqs.length}개`}
        desc="랜딩 하단 FAQ입니다. 기수마다 문의가 많은 내용으로 바꿔주세요."
      >
        <FaqPanel content={content} />
      </Panel>

      <Panel title="푸터" desc="랜딩 맨 아래 연락처 영역입니다.">
        <FooterPanel content={content} />
      </Panel>

      <Panel title="지원 절차 안내 문구" desc="지원자 화면에 표시되는 안내입니다.">
        <ApplyProcessPanel content={content} />
      </Panel>

      <p className={styles.saveNote}>
        <Link href="/" className={styles.previewLink} target="_blank">
          공개 랜딩 미리보기 ↗
        </Link>
      </p>
    </>
  );
}
