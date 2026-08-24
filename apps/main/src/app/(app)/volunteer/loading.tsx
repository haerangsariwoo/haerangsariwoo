import { cn } from "@/lib/cn";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";
import styles from "./loading.module.css";

/**
 * 1365 · VMS 응답을 기다리는 동안 곧바로 보여주는 화면.
 * 이게 없으면 탭을 눌러도 몇 초 동안 아무 반응이 없는 것처럼 보인다.
 * 실제 목록과 같은 묶음·줄 구조로 그려야 응답이 온 순간 화면이 튀지 않는다.
 */
export default function VolunteerLoading() {
  return (
    <Sheet>
      <SheetGroup>
        <div className={styles.head}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>봉사 모집</h1>
            <span className={styles.count}>불러오는 중…</span>
          </div>
          <div className={styles.segment}>
            <span className={styles.segmentBtn}>전체</span>
            <span className={styles.segmentBtn}>1365</span>
            <span className={styles.segmentBtn}>VMS</span>
          </div>
        </div>
      </SheetGroup>

      <SheetGroup>
        <section>
          <div className={styles.list}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={styles.row}>
                <span className={cn(styles.thumb, styles.shine)} />
                <span className={styles.body}>
                  <span className={cn(styles.lineLg, styles.shine)} />
                  <span className={cn(styles.lineSm, styles.shine)} />
                  <span className={cn(styles.pill, styles.shine)} />
                </span>
                <span className={cn(styles.bar, styles.shine)} />
              </div>
            ))}
          </div>
          <p className={styles.note}>1365 · VMS 모집 정보를 불러오고 있어요.</p>
        </section>
      </SheetGroup>
    </Sheet>
  );
}
