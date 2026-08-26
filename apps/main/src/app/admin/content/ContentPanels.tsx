"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import type { AppFaq, NoticeCopy } from "@/lib/app-content";
import type { AppContent } from "@/lib/app-content-queries";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./content.module.css";

/**
 * 앱 문구 패널들. 세 가지(홈 문구·FAQ·화면 안내)가 app_content 한 줄을
 * 나눠 쓴다. Panel(제목·건수) 은 서버 컴포넌트인 page.tsx 가 감싸고,
 * 이 파일은 그 안의 상태를 가진 내용만 맡는다.
 */

export interface ContentPanelProps {
  content: AppContent;
}

/**
 * 저장 버튼의 상태. 예전에는 "저장했습니다" 만 띄우고 실제로는 아무데도
 * 남기지 않았다 — 됐다고 알려 놓고 새로고침하면 사라졌다.
 * 이제 app_content 한 줄 표의 자기 컬럼만 갱신하고, 그 결과를 그대로 알린다.
 */
function useSave() {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  async function save(patch: Record<string, unknown>) {
    setState("saving");
    const { error } = await supabase.from("app_content").update(patch).eq("id", 1);
    setState(error ? "failed" : "saved");
    if (!error) window.setTimeout(() => setState("idle"), 2000);
  }

  return { state, save };
}

function saveNote(state: "idle" | "saving" | "saved" | "failed", idle: string) {
  if (state === "saving") return "저장 중…";
  if (state === "saved") return "저장했습니다.";
  if (state === "failed") return "저장하지 못했습니다. 다시 시도해 주세요.";
  return idle;
}

let faqSeq = 0;

/* ---------- 홈 화면 문구 ---------- */
export function HomeCopyPanel({ content }: ContentPanelProps) {
  const { readOnly } = useSemester();
  const [greetingSuffix, setGreetingSuffix] = useState(content.homeCopy.greetingSuffix);
  const [subGreeting, setSubGreeting] = useState(content.homeCopy.subGreeting);
  const { state, save } = useSave();

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
          {saveNote(state, "저장하면 부원 홈 화면에 즉시 반영됩니다.")}
        </p>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => save({ home_copy: { greetingSuffix, subGreeting } })}
          disabled={readOnly || state === "saving"}
        >
          저장
        </button>
      </div>
    </>
  );
}

/* ---------- 자주 묻는 질문 ---------- */
export function FaqPanel({ content }: ContentPanelProps) {
  const { readOnly } = useSemester();
  const [faqs, setFaqs] = useState<AppFaq[]>(content.faqs);
  const { state, save } = useSave();

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
          {saveNote(state, "순서를 바꾸면 앱에도 같은 순서로 표시됩니다.")}
        </p>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => save({ faqs: faqs.filter((f) => f.q.trim()) })}
          disabled={readOnly || state === "saving"}
        >
          저장
        </button>
      </div>
    </>
  );
}

/* ---------- 화면 안내 문구 ---------- */
export function NoticeCopyPanel({ content }: ContentPanelProps) {
  const { readOnly } = useSemester();
  const [notices, setNotices] = useState<NoticeCopy[]>(content.noticeCopies);
  const { state, save } = useSave();

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
          {saveNote(state, "저장하면 해당 화면에 즉시 반영됩니다.")}
        </p>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => save({ notice_copies: notices })}
          disabled={readOnly || state === "saving"}
        >
          저장
        </button>
      </div>
    </>
  );
}
