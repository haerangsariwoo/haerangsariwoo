import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { teamPool } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./teams.module.css";
import { TeamBoard } from "./TeamBoard";

export const metadata = { title: "팀짜기 · 해랑사리우" };

export default function AdminTeamsPage() {
  return (
    <>
      <Panel
        title="팀짜기"
        desc="이름을 끌어다 놓으면 조가 바뀝니다. 눌러서 고른 뒤 옮길 조를 눌러도 됩니다."
      >
        <TeamBoard initial={teamPool} />

        <div className={styles.publishBar}>
          <p className={styles.publishText}>
            발행하면 부원이 <b>홈 · 내 조</b>에서 결과를 확인할 수 있습니다. (조회 전용)
          </p>
          <button type="button" className={toolbar.button}>
            임시 저장
          </button>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            조 편성 발행
          </button>
        </div>
      </Panel>
    </>
  );
}
