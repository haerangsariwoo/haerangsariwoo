"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  homeCopy as homeCopySeed,
  memberFaqs as memberFaqsSeed,
  noticeCopies as noticeCopiesSeed,
  type AppFaq,
  type NoticeCopy,
} from "@/lib/app-content";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./content.module.css";

/**
 * 앱 문구 패널들. 이 세 가지(홈 문구·FAQ·화면 안내)는 아직 브라우저
 * 저장소에만 남는다 — 앨범은 AlbumPanel.tsx 에서 Supabase 를 쓴다.
 * Panel(제목·건수) 은 서버 컴포넌트인 page.tsx 가 감싸고, 이 파일은
 * 그 안의 상태를 가진 내용만 맡는다.
 */

/** 저장 버튼 옆에 잠깐 떴다 사라지는 확인 메시지 */
function useSaved() {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };
  return [saved, flash] as const;
}

let faqSeq = 0;

/* ---------- 홈 화면 문구 ---------- */
export function HomeCopyPanel() {
  const { readOnly } = useSemester();
  const [greetingSuffix, setGreetingSuffix] = useState(homeCopySeed.greetingSuffix);
  const [subGreeting, setSubGreeting] = useState(homeCopySeed.subGreeting);
  const [saved, flash] = useSaved();

  return (
    <>
      <div className={styles.fieldList}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="greeting">
            인사말 뒤 문구
            <span className={styles.hint}>
              예: 재겸<b>님!</b>
            </span>
          </label>
          <input
            id="greeting"
            className={styles.input}
            value={greetingSuffix}
            onChange={(e) => setGreetingSuffix(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sub">
            안내 한 줄
          </label>
          <input
            id="sub"
            className={styles.input}
            value={subGreeting}
            onChange={(e) => setSubGreeting(e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      <div className={styles.saveBar}>
        <p className={styles.saveNote}>
          {saved ? "저장했습니다." : "저장하면 부원 홈 화면에 즉시 반영됩니다."}
        </p>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={flash}
          disabled={readOnly}
        >
          저장
        </button>
      </div>
    </>
  );
}

/* ---------- 자주 묻는 질문 ---------- */
export function FaqPanel() {
  const { readOnly } = useSemester();
  const [faqs, setFaqs] = useState<AppFaq[]>(memberFaqsSeed);
  const [saved, flash] = useSaved();

  function update(id: string, patch: Partial<AppFaq>) {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function move(index: number, dir: -1 | 1) {
    setFaqs((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  function add() {
    faqSeq += 1;
    setFaqs((prev) => [...prev, { id: `f-new-${faqSeq}`, q: "", a: "" }]);
  }

  return (
    <>
      <div className={styles.itemList}>
        {faqs.map((f, i) => (
          <div key={f.id} className={styles.item}>
            <div className={styles.itemHead}>
              <span className={styles.itemNo}>{i + 1}</span>
              <span className={styles.itemTitle}>질문 {i + 1}</span>
              <button
                type="button"
                className={styles.iconBtn}
                disabled={readOnly || i === 0}
                onClick={() => move(i, -1)}
                aria-label="위로"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                disabled={readOnly || i === faqs.length - 1}
                onClick={() => move(i, 1)}
                aria-label="아래로"
              >
                ↓
              </button>
              <button
                type="button"
                className={cn(styles.iconBtn, styles.danger)}
                onClick={() => remove(f.id)}
                disabled={readOnly}
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
                placeholder="예: 봉사시간은 언제 반영되나요?"
                disabled={readOnly}
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
                placeholder="부원이 볼 답변을 적어주세요."
                disabled={readOnly}
              />
            </div>
          </div>
        ))}
        {faqs.length === 0 && <p className={styles.empty}>등록된 질문이 없습니다.</p>}
      </div>

      <div className={styles.addRow}>
        <button type="button" className={toolbar.button} onClick={add} disabled={readOnly}>
          ＋ 질문 추가
        </button>
      </div>

      <div className={styles.saveBar}>
        <p className={styles.saveNote}>
          {saved ? "저장했습니다." : "순서를 바꾸면 앱에도 같은 순서로 표시됩니다."}
        </p>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={flash}
          disabled={readOnly}
        >
          저장
        </button>
      </div>
    </>
  );
}

/* ---------- 화면 안내 문구 ---------- */
export function NoticeCopyPanel() {
  const { readOnly } = useSemester();
  const [notices, setNotices] = useState<NoticeCopy[]>(noticeCopiesSeed);
  const [saved, flash] = useSaved();

  function update(id: string, text: string) {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  }

  return (
    <>
      <div className={styles.itemList}>
        {notices.map((n) => (
          <div key={n.id} className={styles.item}>
            <div className={styles.itemHead}>
              <span className={styles.screenTag}>{n.screen}</span>
              <span className={styles.itemTitle}>화면 하단 안내</span>
            </div>
            <textarea
              className={styles.textarea}
              value={n.text}
              onChange={(e) => update(n.id, e.target.value)}
              disabled={readOnly}
            />
          </div>
        ))}
      </div>

      <div className={styles.saveBar}>
        <p className={styles.saveNote}>
          {saved ? "저장했습니다." : "저장하면 해당 화면에 즉시 반영됩니다."}
        </p>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={flash}
          disabled={readOnly}
        >
          저장
        </button>
      </div>
    </>
  );
}
