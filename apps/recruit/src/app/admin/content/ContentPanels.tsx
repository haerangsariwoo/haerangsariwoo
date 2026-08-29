"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { ui } from "@/components/admin/Panel";
import { saveLanding, uploadLandingPhoto } from "@/lib/landing-admin";
import {
  defaultPhotoFocus,
  type ActivityCard,
  type HeroSlide,
  type LandingContent,
  type PhotoFocus,
} from "@/lib/recruit-config";
import styles from "@/components/admin/ContentEditor.module.css";
import { PhotoFocusEditor } from "./PhotoFocusEditor";
import { SaveBar } from "./SaveBar";

/**
 * 콘텐츠 관리 일곱 패널. 각 패널은 landing_content 표의 자기 컬럼만
 * 저장하고, 공개 랜딩은 서버에서 그 표를 읽어 그린다. 사진은 누르는 즉시
 * landing-photos 버킷으로 올라가고(그래야 미리보기가 진짜 주소를 가리킨다),
 * 글은 [저장] 을 눌러야 반영된다.
 */

/** 아직 값을 넣지 않은 칸은 기본값이 내려와 있으므로 그대로 초기값으로 쓴다 */
export interface PanelProps {
  content: LandingContent;
}

/**
 * 사진 자리 — 등록돼 있으면 미리보기, 없으면 안내 문구. 눌러서 실제로 고를 수 있다.
 * 홈에서는 고정 비율 박스에 object-fit: cover 로 잘려 보이므로, 사진마다
 * 어느 부분이 보일지(focus) 직접 정할 수 있게 "위치 조정" 을 둔다.
 */
function Photo({
  src,
  alt,
  shape,
  focus,
  onChange,
  onFocusChange,
}: {
  src: string | null;
  alt: string;
  shape: "hero" | "mobileHero" | "card" | "wide";
  focus: PhotoFocus;
  onChange: (url: string) => void;
  onFocusChange: (focus: PhotoFocus) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  return (
    <div className={cn(styles.photoPreview, styles[shape])}>
      {src ? (
        <Image
          className={styles.photoImage}
          src={src}
          alt={alt}
          fill
          sizes="320px"
          unoptimized
          style={{
            objectPosition: `${focus.x}% ${focus.y}%`,
            transform: `scale(${focus.zoom})`,
            transformOrigin: `${focus.x}% ${focus.y}%`,
          }}
        />
      ) : (
        <span className={styles.photoEmpty}>사진 없음</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 골라도 change 가 다시 뜨도록 비운다
          e.target.value = "";
          if (!file) return;
          setUploading(true);
          const url = await uploadLandingPhoto(file);
          setUploading(false);
          if (!url) return;
          onChange(url);
          onFocusChange(defaultPhotoFocus);
        }}
      />
      <div className={styles.photoActions}>
        {src && (
          <button type="button" className={styles.photoBtn} onClick={() => setEditing(true)}>
            위치 조정
          </button>
        )}
        <button
          type="button"
          className={styles.photoBtn}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "올리는 중…" : src ? "교체" : "업로드"}
        </button>
      </div>

      {editing && src && (
        <PhotoFocusEditor
          src={src}
          alt={alt}
          shape={shape}
          focus={focus}
          onChange={onFocusChange}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

let idSeq = 0;
const nextId = (prefix: string) => `${prefix}-new-${++idSeq}`;

/* ---------- 히어로 슬라이더 ---------- */
export function HeroSlidesPanel({ content }: PanelProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(content.heroSlides);

  function update(id: string, patch: Partial<HeroSlide>) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function move(index: number, dir: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(id: string) {
    setSlides((prev) => prev.filter((s) => s.id !== id));
  }

  function add() {
    setSlides((prev) => [
      ...prev,
      { id: nextId("hs"), title: "", subtitle: "", photoUrl: "" },
    ]);
  }

  return (
    <>
      <div className={styles.slideGrid}>
        {slides.map((s, i) => (
          <div key={s.id} className={styles.slide}>
            <div className={styles.slideHead}>
              <span className={styles.slideNo}>{i + 1}</span>
              <span className={styles.slideLabel}>슬라이드 {i + 1}</span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="위로"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="아래로"
                disabled={i === slides.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className={cn(styles.iconBtn, styles.danger)}
                onClick={() => remove(s.id)}
              >
                삭제
              </button>
            </div>

            <p className={styles.photoLabel}>PC 용 사진 (가로)</p>
            <Photo
              src={s.photoUrl || null}
              alt={`${s.title} 슬라이드 사진`}
              shape="hero"
              focus={s.focus ?? defaultPhotoFocus}
              onChange={(url) => update(s.id, { photoUrl: url })}
              onFocusChange={(focus) => update(s.id, { focus })}
            />

            <p className={styles.photoLabel}>
              휴대폰용 사진 (세로) <span className={styles.photoOptional}>선택</span>
            </p>
            <Photo
              src={s.mobilePhotoUrl || null}
              alt={`${s.title} 슬라이드 휴대폰 사진`}
              shape="mobileHero"
              focus={s.mobileFocus ?? defaultPhotoFocus}
              onChange={(url) => update(s.id, { mobilePhotoUrl: url })}
              onFocusChange={(mobileFocus) => update(s.id, { mobileFocus })}
            />
            <p className={styles.photoNote}>
              비워두면 PC 용 사진을 폰에서도 씁니다. PC 는 가로로 넓고 폰은 세로로 길어서,
              한 장만 쓰면 어느 한쪽이 잘립니다.
            </p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${s.id}-title`}>
                제목
              </label>
              <input
                id={`${s.id}-title`}
                className={styles.input}
                value={s.title}
                onChange={(e) => update(s.id, { title: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${s.id}-sub`}>
                부제
              </label>
              <input
                id={`${s.id}-sub`}
                className={styles.input}
                value={s.subtitle}
                onChange={(e) => update(s.id, { subtitle: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.addRow}>
        <button type="button" className={ui.btn} onClick={add}>
          ＋ 슬라이드 추가
        </button>
      </div>

      <SaveBar
        note="사진이 한 장이면 자동 전환과 좌우 화살표는 표시되지 않습니다."
        onSave={() => saveLanding({ hero_slides: slides })}
      />
    </>
  );
}

/* ---------- 소개 ---------- */
interface Fact {
  id: string;
  value: string;
  label: string;
}

export function AboutPanel({ content }: PanelProps) {
  const [body, setBody] = useState(content.aboutBody);
  const [facts, setFacts] = useState<Fact[]>(
    content.aboutFacts.map((f, i) => ({ id: `fact-${i}`, ...f })),
  );
  const [aboutPhoto, setAboutPhoto] = useState(content.aboutPhoto);
  const photoUrl = aboutPhoto.photoUrl;
  const photoFocus = aboutPhoto.focus;
  const setPhotoUrl = (url: string) => setAboutPhoto((prev) => ({ ...prev, photoUrl: url }));
  const setPhotoFocus = (focus: PhotoFocus) => setAboutPhoto((prev) => ({ ...prev, focus }));

  function updateFact(id: string, patch: Partial<Fact>) {
    setFacts((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeFact(id: string) {
    setFacts((prev) => prev.filter((f) => f.id !== id));
  }

  function addFact() {
    setFacts((prev) => [...prev, { id: nextId("fact"), value: "", label: "" }]);
  }

  return (
    <>
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
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              연도 사실
              <span className={styles.hint}>성과 숫자 대신 연도만 사실로 적습니다</span>
            </span>
            <div className={styles.itemList}>
              {facts.map((f, i) => (
                <div key={f.id} className={styles.factRow}>
                  <input
                    className={styles.input}
                    value={f.value}
                    onChange={(e) => updateFact(f.id, { value: e.target.value })}
                    aria-label={`사실 ${i + 1} 값`}
                  />
                  <input
                    className={styles.input}
                    value={f.label}
                    onChange={(e) => updateFact(f.id, { label: e.target.value })}
                    aria-label={`사실 ${i + 1} 설명`}
                  />
                  <button
                    type="button"
                    className={cn(styles.iconBtn, styles.danger)}
                    onClick={() => removeFact(f.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.addRow}>
              <button type="button" className={ui.btn} onClick={addFact}>
                ＋ 사실 추가
              </button>
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>소개 사진</span>
          <Photo
            src={photoUrl}
            alt="소개 사진"
            shape="wide"
            focus={photoFocus}
            onChange={setPhotoUrl}
            onFocusChange={setPhotoFocus}
          />
        </div>
      </div>

      <SaveBar
        note="저장하면 공개 랜딩에 즉시 반영됩니다."
        onSave={() =>
          saveLanding({
            about_body: body,
            about_facts: facts.map(({ value, label }) => ({ value, label })),
            about_photo: aboutPhoto,
          })
        }
      />
    </>
  );
}

/* ---------- 활동 카드 ---------- */
export function ActivityCardsPanel({ content }: PanelProps) {
  const [lead, setLead] = useState(content.activitiesLead);
  const [cards, setCards] = useState<ActivityCard[]>(content.activityCards);

  function update(id: string, patch: Partial<ActivityCard>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  return (
    <>
      <div className={styles.fieldList}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="activities-lead">
            영역 소개 문장
          </label>
          <input
            id="activities-lead"
            className={styles.input}
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.cardRow}>
        {cards.map((a) => (
          <div key={a.id} className={styles.card}>
            <Photo
              src={a.photoUrl}
              alt={`${a.title} 사진`}
              shape="card"
              focus={a.focus ?? defaultPhotoFocus}
              onChange={(url) => update(a.id, { photoUrl: url })}
              onFocusChange={(focus) => update(a.id, { focus })}
            />
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${a.id}-title`}>
                제목
              </label>
              <input
                id={`${a.id}-title`}
                className={styles.input}
                value={a.title}
                onChange={(e) => update(a.id, { title: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${a.id}-short`}>
                짧은 이름
                <span className={styles.hint}>사진 위에 항상 보입니다 (예: 친바)</span>
              </label>
              <input
                id={`${a.id}-short`}
                className={styles.input}
                value={a.shortLabel}
                onChange={(e) => update(a.id, { shortLabel: e.target.value })}
              />
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
                value={a.desc}
                onChange={(e) => update(a.id, { desc: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <SaveBar
        note="사진은 4:3 비율로 잘려 보입니다."
        onSave={() => saveLanding({ activities_lead: lead, activity_cards: cards })}
      />
    </>
  );
}

/* ---------- 모집 안내 ---------- */
interface ChecklistItem {
  id: string;
  text: string;
}

export function RecruitingPanel({ content }: PanelProps) {
  const [lead, setLead] = useState(content.recruitingLead);
  const [checklistTitle, setChecklistTitle] = useState(content.checklistTitle);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    content.checklist.map((text, i) => ({ id: `check-${i}`, text })),
  );
  const [quote, setQuote] = useState(content.quote);

  function updateItem(id: string, text: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
  }

  function removeItem(id: string) {
    setChecklist((prev) => prev.filter((c) => c.id !== id));
  }

  function addItem() {
    if (checklist.length >= 4) return;
    setChecklist((prev) => [...prev, { id: nextId("check"), text: "" }]);
  }

  return (
    <>
      <div className={styles.fieldList}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recruit-lead">
            모집 시기 안내
          </label>
          <input
            id="recruit-lead"
            className={styles.input}
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="checklist-title">
            체크리스트 제목
          </label>
          <input
            id="checklist-title"
            className={styles.input}
            value={checklistTitle}
            onChange={(e) => setChecklistTitle(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            찾고 있는 사람
            <span className={styles.hint}>짧은 명사구 + ~분, 4개를 넘기지 않습니다</span>
          </span>
          <div className={styles.itemList}>
            {checklist.map((c, i) => (
              <div key={c.id} className={styles.itemHead}>
                <span className={styles.itemNo}>{i + 1}</span>
                <input
                  className={styles.input}
                  value={c.text}
                  onChange={(e) => updateItem(c.id, e.target.value)}
                  aria-label={`조건 ${i + 1}`}
                />
                <button
                  type="button"
                  className={cn(styles.iconBtn, styles.danger)}
                  onClick={() => removeItem(c.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addRow}>
            <button type="button" className={ui.btn} onClick={addItem} disabled={checklist.length >= 4}>
              ＋ 조건 추가
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="quote">
            마무리 인용문
          </label>
          <input
            id="quote"
            className={styles.input}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
        </div>
      </div>

      <SaveBar
        note="모집 일정과 접수 on/off 는 [모집 설정] 에서 바꿉니다."
        onSave={() =>
          saveLanding({
            recruiting_lead: lead,
            checklist_title: checklistTitle,
            checklist: checklist.map((c) => c.text).filter(Boolean),
            quote,
          })
        }
      />
    </>
  );
}

/* ---------- FAQ ---------- */
interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export function FaqPanel({ content }: PanelProps) {
  const [faqItems, setFaqItems] = useState<FaqItem[]>(
    content.faqs.map((f, i) => ({ id: `faq-${i}`, ...f })),
  );

  function update(id: string, patch: Partial<FaqItem>) {
    setFaqItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function move(index: number, dir: -1 | 1) {
    setFaqItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(id: string) {
    setFaqItems((prev) => prev.filter((f) => f.id !== id));
  }

  function add() {
    setFaqItems((prev) => [...prev, { id: nextId("faq"), q: "", a: "" }]);
  }

  return (
    <>
      <div className={styles.itemList}>
        {faqItems.map((f, i) => (
          <div key={f.id} className={styles.item}>
            <div className={styles.itemHead}>
              <span className={styles.itemNo}>{i + 1}</span>
              <span className={styles.itemTitle}>질문 {i + 1}</span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="위로"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="아래로"
                disabled={i === faqItems.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className={cn(styles.iconBtn, styles.danger)}
                onClick={() => remove(f.id)}
              >
                삭제
              </button>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${f.id}-q`}>
                질문
              </label>
              <input
                id={`${f.id}-q`}
                className={styles.input}
                value={f.q}
                onChange={(e) => update(f.id, { q: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${f.id}-a`}>
                답변
              </label>
              <textarea
                id={`${f.id}-a`}
                className={styles.textarea}
                value={f.a}
                onChange={(e) => update(f.id, { a: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.addRow}>
        <button type="button" className={ui.btn} onClick={add}>
          ＋ 질문 추가
        </button>
      </div>

      <SaveBar
        note="순서를 바꾸면 랜딩에도 같은 순서로 표시됩니다."
        onSave={() =>
          saveLanding({ faqs: faqItems.map(({ q, a }) => ({ q, a })).filter((f) => f.q) })
        }
      />
    </>
  );
}

/* ---------- 푸터 ---------- */
export function FooterPanel({ content }: PanelProps) {
  const [address, setAddress] = useState(content.footerAddress);
  const [instagram, setInstagram] = useState(content.footerInstagram);

  return (
    <>
      <div className={styles.fieldList}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="footer-address">
            주소
          </label>
          <input
            id="footer-address"
            className={styles.input}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="footer-insta">
            Instagram 주소
          </label>
          <input
            id="footer-insta"
            className={styles.input}
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </div>
      </div>

      <SaveBar
        note="개인 연락처 대신 공식 채널만 노출합니다."
        onSave={() => saveLanding({ footer_address: address, footer_instagram: instagram })}
      />
    </>
  );
}

/* ---------- 지원 절차 안내 ---------- */
interface StepItem {
  id: string;
  text: string;
}

export function ApplyProcessPanel({ content }: PanelProps) {
  const [place, setPlace] = useState(content.interviewPlace);
  const [steps, setSteps] = useState<StepItem[]>(
    content.nextSteps.map((text, i) => ({ id: `step-${i}`, text })),
  );

  function updateStep(id: string, text: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function addStep() {
    setSteps((prev) => [...prev, { id: nextId("step"), text: "" }]);
  }

  return (
    <>
      <div className={styles.fieldList}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="place">
            면접 장소 안내
            <span className={styles.hint}>1차 합격자 화면에 표시</span>
          </label>
          <input
            id="place"
            className={styles.input}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            최종 합격 후 다음 단계
            <span className={styles.hint}>합격 화면에 순서대로 표시</span>
          </span>
          <div className={styles.itemList}>
            {steps.map((s, i) => (
              <div key={s.id} className={styles.itemHead}>
                <span className={styles.itemNo}>{i + 1}</span>
                <input
                  className={styles.input}
                  value={s.text}
                  onChange={(e) => updateStep(s.id, e.target.value)}
                  aria-label={`단계 ${i + 1}`}
                />
                <button
                  type="button"
                  className={cn(styles.iconBtn, styles.danger)}
                  onClick={() => removeStep(s.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addRow}>
            <button type="button" className={ui.btn} onClick={addStep}>
              ＋ 단계 추가
            </button>
          </div>
        </div>
      </div>

      <SaveBar
        note="불합격 안내에는 문의 채널을 노출하지 않는 정책이 적용됩니다."
        onSave={() =>
          saveLanding({
            interview_place: place,
            next_steps: steps.map((s) => s.text).filter(Boolean),
          })
        }
      />
    </>
  );
}
