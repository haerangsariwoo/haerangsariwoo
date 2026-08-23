"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell/Shell";
import { Button } from "@/components/ui/Button/Button";
import { TextArea, TextField } from "@/components/ui/Field/Field";
import { applicationFields, motivationField } from "@/lib/recruit-config";
import { useStudentId } from "@/lib/apply-session";
import styles from "../apply.module.css";

type Values = Record<string, string>;

const STEP_TOTAL = 4;

export default function ApplicationFormPage() {
  const router = useRouter();
  // 1단계에서 확인한 학번. 다시 묻지 않고 확인만 시켜준다.
  const studentId = useStudentId();
  const [step, setStep] = useState(2); // 1단계(지원자 확인)는 이전 화면에서 완료
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Values>({});
  const [agreed, setAgreed] = useState({ info: false, code: false, privacy: false });

  const set = (name: string) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  function validateBasics() {
    const next: Values = {};
    for (const f of applicationFields) {
      if (f.required && !(values[f.name] ?? "").trim()) {
        next[f.name] = `${f.label}을(를) 입력해 주세요.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateMotivation() {
    const next: Values = {};
    if (!(values.motivation ?? "").trim()) {
      next.motivation = "지원 동기를 작성해 주세요.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (step === 2 && validateBasics()) setStep(3);
    else if (step === 3 && validateMotivation()) setStep(4);
  }

  const allAgreed = agreed.info && agreed.code && agreed.privacy;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!allAgreed) return;
    // TODO: Supabase — applicants 테이블에 지원서 저장
    router.push("/apply/status");
  }

  return (
    <Shell
      title="신입부원 지원하기"
      back="/apply"
      step={{ current: step, total: STEP_TOTAL }}
    >
      {step === 2 && (
        <>
          <div className={styles.intro}>
            <h1 className={styles.introTitle}>기본 정보를 입력해 주세요</h1>
            <p className={styles.introDesc}>입력 내용은 자동으로 임시 저장됩니다.</p>
          </div>

          <form className={styles.form} onSubmit={handleNext} noValidate>
            {/* 1단계에서 확인한 학번 — 수정하려면 이전 단계로 돌아간다 */}
            <div className={styles.lockedField}>
              <span className={styles.label}>학번</span>
              <div className={styles.lockedRow}>
                <span className={styles.lockedValue}>{studentId ?? "이전 단계에서 확인"}</span>
                <span className={styles.lockedTag}>1단계에서 확인함</span>
              </div>
            </div>

            {applicationFields.map((f) => (
              <TextField
                key={f.name}
                label={f.label}
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                inputMode={f.type === "number" ? "numeric" : f.type === "tel" ? "tel" : undefined}
                value={values[f.name] ?? ""}
                onChange={set(f.name)}
                error={errors[f.name]}
              />
            ))}

            <div className={styles.actions}>
              <Button type="button" variant="outline" size="lg" onClick={() => router.push("/apply")}>
                이전
              </Button>
              <Button type="submit" variant="primary" size="lg" className={styles.grow}>
                다음 · 지원 동기
              </Button>
            </div>
          </form>
          <p className={styles.stepNote}>2단계 / 4단계</p>
        </>
      )}

      {step === 3 && (
        <>
          <div className={styles.intro}>
            <h1 className={styles.introTitle}>마지막으로 지원 동기를 들려주세요</h1>
            <p className={styles.introDesc}>
              해랑사리우와 함께하고 싶은 이유를 자유롭게 작성해 주세요.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleNext} noValidate>
            <TextArea
              label={motivationField.label}
              name={motivationField.name}
              required
              placeholder={motivationField.placeholder}
              maxLength={motivationField.maxLength}
              value={values.motivation ?? ""}
              onChange={set("motivation")}
              error={errors.motivation}
            />

            <div className={styles.actions}>
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)}>
                이전
              </Button>
              <Button type="submit" variant="primary" size="lg" className={styles.grow}>
                다음 · 제출 확인
              </Button>
            </div>
          </form>
          <p className={styles.stepNote}>3단계 / 4단계</p>
        </>
      )}

      {step === 4 && (
        <>
          <div className={styles.intro}>
            <h1 className={styles.introTitle}>제출 전 확인해 주세요</h1>
            <p className={styles.introDesc}>
              제출 후에도 마감 전까지는 지원 내용을 다시 확인할 수 있어요.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.checkCard}>
              <p className={styles.checkTitle}>제출 전 확인</p>

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={agreed.info}
                  onChange={(e) => setAgreed((a) => ({ ...a, info: e.target.checked }))}
                />
                입력한 개인정보가 정확해요
              </label>

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={agreed.code}
                  onChange={(e) => setAgreed((a) => ({ ...a, code: e.target.checked }))}
                />
                본인 지정번호를 기억하고 있어요 (결과 확인에 필요해요)
              </label>

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={agreed.privacy}
                  onChange={(e) => setAgreed((a) => ({ ...a, privacy: e.target.checked }))}
                />
                개인정보 수집·이용에 동의해요
              </label>
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="outline" size="lg" onClick={() => setStep(3)}>
                이전
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className={styles.grow}
                disabled={!allAgreed}
              >
                지원서 제출
              </Button>
            </div>
          </form>
          <p className={styles.stepNote}>
            {allAgreed ? "4단계 / 4단계" : "모든 항목에 동의해야 제출할 수 있어요."}
          </p>
        </>
      )}
    </Shell>
  );
}
