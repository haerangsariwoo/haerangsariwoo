import Link from "next/link";
import { Shell } from "@/components/layout/Shell/Shell";
import { Button } from "@/components/ui/Button/Button";
import { getRecruitSettings } from "@/lib/content-queries";
import { cohortLabel } from "@/lib/recruit-config";
import styles from "./done.module.css";

export const metadata = { title: "지원 완료 · 해랑사리우" };

/**
 * 지원서를 낸 직후 보는 화면.
 *
 * 예전에는 제출하자마자 지원 현황으로 보냈는데, 그 화면은 학번과 본인
 * 비밀번호를 다시 받는다. 방금 제출한 사람에게 "누구세요" 를 묻는 셈이라
 * 제출이 됐는지조차 알 수 없었다. 여기서 한 번 확실히 알려준다.
 */
export default async function ApplyDonePage() {
  const config = await getRecruitSettings();

  return (
    <Shell title="지원 완료" back="/">
      <div className={styles.icon} aria-hidden="true">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </div>

      <h1 className={styles.title}>지원서가 제출됐어요!</h1>
      <p className={styles.lead}>
        {config.semester} {cohortLabel(config.year, config.semesterNo)} 신입부원 모집에
        지원해 주셔서 감사합니다.
      </p>

      <div className={styles.remind}>
        <p className={styles.remindTitle}>비밀번호를 꼭 기억해 주세요</p>
        <p className={styles.remindBody}>
          결과 확인과 면접 시간 선택에 <b>학번과 비밀번호</b>가 계속 필요해요.
          운영진도 번호를 대신 확인해 드릴 수 없습니다.
        </p>
      </div>

      <div className={styles.next}>
        <p className={styles.nextTitle}>다음 일정</p>
        <div className={styles.nextRow}>
          <span className={styles.nextLabel}>1차 결과 발표</span>
          <span className={styles.nextValue}>{config.firstResultDate}</span>
        </div>
        <div className={styles.nextRow}>
          <span className={styles.nextLabel}>최종 결과 발표</span>
          <span className={styles.nextValue}>{config.finalResultDate}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/apply/status" className={styles.actionLink}>
          <Button type="button" variant="primary" size="lg" fullWidth>
            지원 현황 확인하기
          </Button>
        </Link>
        <Link href="/" className={styles.homeLink}>
          홈으로 돌아가기
        </Link>
      </div>
    </Shell>
  );
}
