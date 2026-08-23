import { cn } from "@/lib/cn";
import { Panel, ui } from "@/components/admin/Panel";
import { cohortLabel, activityCards, applicationFields, motivationField, recruitConfig } from "@/lib/recruit-config";
import styles from "./settings.module.css";

export const metadata = { title: "모집 설정 · 해랑사리우" };

export default function RecruitSettingsPage() {
  const schedule = [
    { label: "지원 시작", value: recruitConfig.applyStart },
    { label: "지원 마감", value: recruitConfig.applyEnd },
    { label: "1차 발표", value: recruitConfig.firstResultDate },
    { label: "면접 기간", value: recruitConfig.interviewRange },
    { label: "최종 발표", value: recruitConfig.finalResultDate },
  ];

  return (
    <>
      <Panel title="접수 상태" desc="접수를 끄면 랜딩 소개는 그대로 공개되고 지원 버튼만 비활성화됩니다.">
        <div className={styles.toggleRow}>
          <div className={styles.toggleText}>
            <p className={styles.toggleTitle}>
              지원 접수 {recruitConfig.applicationsOpen ? "받는 중" : "중지"}
            </p>
            <p className={styles.toggleDesc}>
              오프시즌에도 랜딩은 상시 공개됩니다. 접수를 끄면 지원자에게 &ldquo;모집 준비 중&rdquo;으로
              표시됩니다.
            </p>
          </div>
          <button
            type="button"
            className={cn(styles.switch, !recruitConfig.applicationsOpen && styles.off)}
            aria-pressed={recruitConfig.applicationsOpen}
            aria-label="지원 접수 토글"
          >
            <span className={styles.knob} />
          </button>
        </div>
      </Panel>

      <div className={styles.row}>
        <Panel title="기수 · 일정" desc="고정값 없이 학기마다 수정합니다.">
          <div className={styles.fieldList}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cohort">
                기수
              </label>
              <input
                id="cohort"
                className={styles.input}
                defaultValue={`${cohortLabel(recruitConfig.year, recruitConfig.semesterNo)} · ${recruitConfig.semester}`}
              />
            </div>
            {schedule.map((s) => (
              <div key={s.label} className={styles.field}>
                <label className={styles.label} htmlFor={s.label}>
                  {s.label}
                </label>
                <input id={s.label} className={styles.input} defaultValue={s.value} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="지원서 문항" desc="문항을 추가·수정하면 지원 화면에 즉시 반영됩니다.">
          <div className={styles.questionList}>
            {[...applicationFields, motivationField].map((f) => (
              <div key={f.name} className={styles.question}>
                <span className={styles.qLabel}>{f.label}</span>
                <span className={styles.qType}>
                  {f.type === "textarea" ? `서술 · ${f.maxLength}자` : f.type}
                  {f.required ? " · 필수" : ""}
                </span>
                <button type="button" className={ui.rowBtn}>
                  수정
                </button>
              </div>
            ))}
          </div>
          <div className={ui.toolbar} style={{ marginTop: 16, marginBottom: 0 }}>
            <button type="button" className={ui.btn}>
              ＋ 문항 추가
            </button>
          </div>
        </Panel>
      </div>

      <Panel
        title="랜딩 활동 사진"
        desc="공개 랜딩의 활동 카드 사진입니다. 언제든 업로드·교체할 수 있습니다."
      >
        <div className={styles.photoRow}>
          {activityCards.map((a) => (
            <div key={a.id} className={styles.photoCard}>
              <div className={styles.photoBox}>{a.photoUrl ? "등록됨" : "사진 없음"}</div>
              <p className={styles.photoTitle}>{a.title}</p>
              <button type="button" className={styles.uploadBtn}>
                사진 업로드
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
