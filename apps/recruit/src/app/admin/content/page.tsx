import { cn } from "@/lib/cn";
import { Panel, ui } from "@/components/admin/Panel";
import {
  activityCards,
  brand,
  faqs,
  interviewPlace,
  nextSteps,
} from "@/lib/recruit-config";
import styles from "@/components/admin/ContentEditor.module.css";

export const metadata = { title: "랜딩 콘텐츠 · 해랑사리우" };

export default function RecruitContentPage() {
  return (
    <>
      <Panel
        title="브랜드 문구"
        desc="공개 랜딩 상단에 노출되는 슬로건입니다. 문구를 바꾸면 랜딩에 바로 반영됩니다."
      >
        <div className={styles.fieldList}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="slogan1">
              슬로건 1행
            </label>
            <input id="slogan1" className={styles.input} defaultValue={brand.slogan1} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="slogan2">
              슬로건 2행
            </label>
            <input id="slogan2" className={styles.input} defaultValue={brand.slogan2} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tradition">
              전통 안내
              <span className={styles.hint}>연도가 바뀌면 함께 수정해 주세요</span>
            </label>
            <input id="tradition" className={styles.input} defaultValue={brand.tradition} />
          </div>
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>저장하면 공개 랜딩에 즉시 반영됩니다.</p>
          <button type="button" className={cn(ui.btn, ui.primary)}>
            저장
          </button>
        </div>
      </Panel>

      <Panel
        title="활동 카드"
        desc="랜딩의 '해랑사리우에서 함께해요' 영역입니다. 사진과 문구를 함께 관리합니다."
      >
        <div className={styles.cardRow}>
          {activityCards.map((a) => (
            <div key={a.id} className={styles.card}>
              <div className={styles.photoBox}>{a.photoUrl ? "사진 등록됨" : "사진 없음"}</div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${a.id}-title`}>
                  제목
                </label>
                <input id={`${a.id}-title`} className={styles.input} defaultValue={a.title} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${a.id}-desc`}>
                  설명
                </label>
                <input id={`${a.id}-desc`} className={styles.input} defaultValue={a.desc} />
              </div>
              <button type="button" className={ui.btn}>
                사진 업로드
              </button>
            </div>
          ))}
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>사진은 언제든 교체할 수 있습니다.</p>
          <button type="button" className={cn(ui.btn, ui.primary)}>
            저장
          </button>
        </div>
      </Panel>

      <Panel
        title="자주 묻는 질문 (Q&A)"
        count={`${faqs.length}개`}
        desc="랜딩 하단 FAQ입니다. 기수마다 문의가 많은 내용으로 바꿔주세요."
      >
        <div className={styles.itemList}>
          {faqs.map((f, i) => (
            <div key={f.q} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.itemNo}>{i + 1}</span>
                <span className={styles.itemTitle}>질문 {i + 1}</span>
                <button type="button" className={styles.iconBtn}>
                  ↑
                </button>
                <button type="button" className={styles.iconBtn}>
                  ↓
                </button>
                <button type="button" className={cn(styles.iconBtn, styles.danger)}>
                  삭제
                </button>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`faq-q-${i}`}>
                  질문
                </label>
                <input id={`faq-q-${i}`} className={styles.input} defaultValue={f.q} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`faq-a-${i}`}>
                  답변
                </label>
                <textarea id={`faq-a-${i}`} className={styles.textarea} defaultValue={f.a} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <button type="button" className={ui.btn}>
            ＋ 질문 추가
          </button>
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>순서를 바꾸면 랜딩에도 같은 순서로 표시됩니다.</p>
          <button type="button" className={cn(ui.btn, ui.primary)}>
            저장
          </button>
        </div>
      </Panel>

      <Panel title="안내 문구" desc="지원 절차 화면에 표시되는 안내입니다.">
        <div className={styles.fieldList}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="place">
              면접 장소 안내
              <span className={styles.hint}>1차 합격자 화면에 표시</span>
            </label>
            <input id="place" className={styles.input} defaultValue={interviewPlace} />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              최종 합격 후 다음 단계
              <span className={styles.hint}>합격 화면에 순서대로 표시</span>
            </span>
            <div className={styles.itemList}>
              {nextSteps.map((s, i) => (
                <div key={s} className={styles.itemHead}>
                  <span className={styles.itemNo}>{i + 1}</span>
                  <input className={styles.input} defaultValue={s} />
                  <button type="button" className={cn(styles.iconBtn, styles.danger)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.addRow}>
              <button type="button" className={ui.btn}>
                ＋ 단계 추가
              </button>
            </div>
          </div>
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>
            불합격 안내에는 문의 채널을 노출하지 않는 정책이 적용됩니다.
          </p>
          <button type="button" className={cn(ui.btn, ui.primary)}>
            저장
          </button>
        </div>
      </Panel>
    </>
  );
}
