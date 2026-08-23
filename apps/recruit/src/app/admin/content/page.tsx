import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel, ui } from "@/components/admin/Panel";
import {
  activityCards,
  faqs,
  heroSlides,
  interviewPlace,
  landing,
  nextSteps,
} from "@/lib/recruit-config";
import styles from "@/components/admin/ContentEditor.module.css";
import { SaveBar } from "./SaveBar";

export const metadata = { title: "랜딩 콘텐츠 · 해랑사리우" };

/** 사진 자리 — 등록돼 있으면 미리보기, 없으면 안내 문구 */
function Photo({
  src,
  alt,
  shape,
}: {
  src: string | null;
  alt: string;
  shape: "hero" | "card" | "wide";
}) {
  return (
    <div className={cn(styles.photoPreview, styles[shape])}>
      {src ? (
        <Image className={styles.photoImage} src={src} alt={alt} fill sizes="320px" unoptimized />
      ) : (
        <span className={styles.photoEmpty}>사진 없음</span>
      )}
      <div className={styles.photoActions}>
        <button type="button" className={styles.photoBtn}>
          {src ? "교체" : "업로드"}
        </button>
      </div>
    </div>
  );
}



export default function RecruitContentPage() {
  return (
    <>
      {/* ---------- 히어로 ---------- */}
      <Panel
        title="히어로 슬라이더"
        count={`${heroSlides.length}장`}
        desc="랜딩 최상단에서 자동으로 넘어가는 사진입니다. 사진마다 제목과 부제를 따로 관리합니다."
      >
        <div className={styles.slideGrid}>
          {heroSlides.map((s, i) => (
            <div key={s.id} className={styles.slide}>
              <div className={styles.slideHead}>
                <span className={styles.slideNo}>{i + 1}</span>
                <span className={styles.slideLabel}>슬라이드 {i + 1}</span>
                <button type="button" className={styles.iconBtn} aria-label="위로">
                  ↑
                </button>
                <button type="button" className={styles.iconBtn} aria-label="아래로">
                  ↓
                </button>
                <button type="button" className={cn(styles.iconBtn, styles.danger)}>
                  삭제
                </button>
              </div>

              <Photo src={s.photoUrl} alt={`${s.title} 슬라이드 사진`} shape="hero" />

              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${s.id}-title`}>
                  제목
                </label>
                <input id={`${s.id}-title`} className={styles.input} defaultValue={s.title} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${s.id}-sub`}>
                  부제
                </label>
                <input id={`${s.id}-sub`} className={styles.input} defaultValue={s.subtitle} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <button type="button" className={ui.btn}>
            ＋ 슬라이드 추가
          </button>
        </div>

        <SaveBar note="사진이 한 장이면 자동 전환과 좌우 화살표는 표시되지 않습니다." />
      </Panel>

      {/* ---------- 소개 ---------- */}
      <Panel title="소개 (About)" desc="동아리를 설명하는 한 단락과 사진, 연도 사실입니다.">
        <div className={styles.twoCol}>
          <div className={styles.fieldList}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="about-body">
                소개 본문
                <span className={styles.hint}>2–4문장 한 단락으로 씁니다</span>
              </label>
              <textarea
                id="about-body"
                className={styles.textarea}
                rows={6}
                defaultValue={landing.about.body}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                연도 사실
                <span className={styles.hint}>성과 숫자 대신 연도만 사실로 적습니다</span>
              </span>
              <div className={styles.itemList}>
                <div className={styles.factRow}>
                  <input className={styles.input} defaultValue="1996" aria-label="사실 1 값" />
                  <input
                    className={styles.input}
                    defaultValue="한성대학교 중앙 봉사동아리로 창설"
                    aria-label="사실 1 설명"
                  />
                  <button type="button" className={cn(styles.iconBtn, styles.danger)}>
                    삭제
                  </button>
                </div>
                <div className={styles.factRow}>
                  <input className={styles.input} defaultValue="30년" aria-label="사실 2 값" />
                  <input
                    className={styles.input}
                    defaultValue="지금까지 이어온 봉사의 전통"
                    aria-label="사실 2 설명"
                  />
                  <button type="button" className={cn(styles.iconBtn, styles.danger)}>
                    삭제
                  </button>
                </div>
              </div>
              <div className={styles.addRow}>
                <button type="button" className={ui.btn}>
                  ＋ 사실 추가
                </button>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>소개 사진</span>
            <Photo src="/landing/about.svg" alt="소개 사진" shape="wide" />
          </div>
        </div>

        <SaveBar note="저장하면 공개 랜딩에 즉시 반영됩니다." />
      </Panel>

      {/* ---------- 활동 카드 ---------- */}
      <Panel
        title="활동 카드"
        count={`${activityCards.length}개`}
        desc="랜딩 Activities 영역입니다. 사진을 누르면 크게 볼 수 있으므로 원본 화질로 올려주세요."
      >
        <div className={styles.fieldList}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="activities-lead">
              영역 소개 문장
            </label>
            <input
              id="activities-lead"
              className={styles.input}
              defaultValue={landing.activities.lead}
            />
          </div>
        </div>

        <div className={styles.cardRow}>
          {activityCards.map((a) => (
            <div key={a.id} className={styles.card}>
              <Photo src={a.photoUrl} alt={`${a.title} 사진`} shape="card" />
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${a.id}-title`}>
                  제목
                </label>
                <input id={`${a.id}-title`} className={styles.input} defaultValue={a.title} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${a.id}-desc`}>
                  설명
                  <span className={styles.hint}>1–2문장, 세 카드 길이를 비슷하게</span>
                </label>
                <textarea
                  id={`${a.id}-desc`}
                  className={styles.textarea}
                  rows={3}
                  defaultValue={a.desc}
                />
              </div>
            </div>
          ))}
        </div>

        <SaveBar note="사진은 4:3 비율로 잘려 보입니다." />
      </Panel>

      {/* ---------- 모집 안내 ---------- */}
      <Panel title="모집 안내 (Recruiting)" desc="지원 자격 안내와 마무리 문구입니다.">
        <div className={styles.fieldList}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="recruit-lead">
              모집 시기 안내
            </label>
            <input
              id="recruit-lead"
              className={styles.input}
              defaultValue={landing.recruiting.lead}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checklist-title">
              체크리스트 제목
            </label>
            <input
              id="checklist-title"
              className={styles.input}
              defaultValue={landing.recruiting.checklistTitle}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              찾고 있는 사람
              <span className={styles.hint}>짧은 명사구 + ~분, 4개를 넘기지 않습니다</span>
            </span>
            <div className={styles.itemList}>
              {landing.recruiting.checklist.map((c, i) => (
                <div key={c} className={styles.itemHead}>
                  <span className={styles.itemNo}>{i + 1}</span>
                  <input className={styles.input} defaultValue={c} aria-label={`조건 ${i + 1}`} />
                  <button type="button" className={cn(styles.iconBtn, styles.danger)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.addRow}>
              <button type="button" className={ui.btn}>
                ＋ 조건 추가
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="quote">
              마무리 인용문
            </label>
            <input id="quote" className={styles.input} defaultValue={landing.recruiting.quote} />
          </div>
        </div>

        <SaveBar note="모집 일정과 접수 on/off 는 [모집 설정] 에서 바꿉니다." />
      </Panel>

      {/* ---------- FAQ ---------- */}
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
                <button type="button" className={styles.iconBtn} aria-label="위로">
                  ↑
                </button>
                <button type="button" className={styles.iconBtn} aria-label="아래로">
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

        <SaveBar note="순서를 바꾸면 랜딩에도 같은 순서로 표시됩니다." />
      </Panel>

      {/* ---------- 푸터 ---------- */}
      <Panel title="푸터" desc="랜딩 맨 아래 연락처 영역입니다.">
        <div className={styles.fieldList}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="footer-address">
              주소
            </label>
            <input
              id="footer-address"
              className={styles.input}
              defaultValue={landing.footer.address}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="footer-insta">
              Instagram 주소
            </label>
            <input
              id="footer-insta"
              className={styles.input}
              defaultValue={landing.footer.instagram}
            />
          </div>
        </div>

        <SaveBar note="개인 연락처 대신 공식 채널만 노출합니다." />
      </Panel>

      {/* ---------- 지원 절차 안내 ---------- */}
      <Panel title="지원 절차 안내 문구" desc="지원자 화면에 표시되는 안내입니다.">
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
                  <input className={styles.input} defaultValue={s} aria-label={`단계 ${i + 1}`} />
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

        <SaveBar note="불합격 안내에는 문의 채널을 노출하지 않는 정책이 적용됩니다." />
      </Panel>

      <p className={styles.saveNote}>
        <Link href="/" className={styles.previewLink} target="_blank">
          공개 랜딩 미리보기 ↗
        </Link>
      </p>
    </>
  );
}
