"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Shell } from "@/components/layout/Shell/Shell";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/Field/Field";
import { cohortLabel, nextSteps, recruitConfig } from "@/lib/recruit-config";
import { useApplyCode, useStudentId } from "@/lib/apply-session";
import styles from "./status.module.css";

type Stage = "submitted" | "firstPass" | "firstFail" | "finalPass" | "finalFail";

interface StatusResult {
  firstResult: "대기" | "합격" | "불합격";
  finalResult: "대기" | "합격" | "불합격";
  interview: string | null;
  firstPublished: boolean;
  finalPublished: boolean;
}

const CheckIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

function stageOf(r: StatusResult): Stage {
  if (!r.firstPublished) return "submitted";
  if (r.firstResult === "불합격") return "firstFail";
  if (!r.finalPublished) return "firstPass";
  if (r.finalResult === "합격") return "finalPass";
  if (r.finalResult === "불합격") return "finalFail";
  return "firstPass";
}

export default function StatusPage() {
  const sessionStudentId = useStudentId();
  const sessionCode = useApplyCode();

  const [studentId, setStudentId] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ studentId?: string; code?: string }>({});
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);
  const triedSession = useRef(false);

  async function check(sid: string, c: string) {
    setChecking(true);
    setErrors({});
    const res = await fetch("/api/apply/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: sid, code: c }),
    });
    const data = await res.json();
    setChecking(false);

    if (!res.ok) {
      setErrors({ code: data.error ?? "확인 중 문제가 발생했습니다." });
      return false;
    }
    setResult(data);
    return true;
  }

  useEffect(() => {
    if (triedSession.current) return;
    if (sessionStudentId && sessionCode) {
      triedSession.current = true;
      queueMicrotask(() => check(sessionStudentId, sessionCode));
    }
  }, [sessionStudentId, sessionCode]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\d{7}$/.test(studentId.trim())) next.studentId = "학번 7자리를 정확히 입력해 주세요.";
    if (!/^\d{6}$/.test(code.trim())) next.code = "숫자 6자리를 입력해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    check(studentId.trim(), code.trim());
  }

  if (!result) {
    return (
      <Shell title="지원 현황" back="/">
        <h1 className={styles.centerTitle}>학번과 본인 지정번호로 확인해요</h1>
        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="학번"
            name="studentId"
            required
            placeholder="예: 2026000"
            inputMode="numeric"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            error={errors.studentId}
          />
          <TextField
            label="본인 지정번호"
            name="code"
            required
            type="password"
            placeholder="숫자 6자리"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={errors.code}
          />
          <div className={styles.footerAction}>
            <Button type="submit" variant="primary" size="lg" fullWidth disabled={checking}>
              {checking ? "확인 중..." : "지원 현황 확인"}
            </Button>
          </div>
        </form>
      </Shell>
    );
  }

  const stage = stageOf(result);

  return (
    <Shell title="지원 현황" back="/">
      {stage === "submitted" && (
        <>
          <div className={styles.successIcon}>
            <CheckIcon size={34} />
          </div>
          <h1 className={styles.centerTitle}>지원서가 제출됐어요!</h1>

          <div className={styles.timeline}>
            <p className={styles.timelineTitle}>
              {recruitConfig.semester} {cohortLabel(recruitConfig.year, recruitConfig.semesterNo)} 신입부원 모집
            </p>
            {[
              { label: "지원서 제출", done: true },
              { label: "1차 심사", done: false },
              { label: "면접", done: false },
              { label: "최종 발표", done: false },
            ].map((s, i) => (
              <div key={s.label} className={styles.stepRow}>
                <span className={cn(styles.stepIcon, s.done && styles.done)}>
                  {s.done ? <CheckIcon size={14} /> : i + 1}
                </span>
                <span className={styles.stepLabel}>{s.label}</span>
                <span className={cn(styles.stepState, s.done && styles.done)}>
                  {s.done ? "완료" : "대기"}
                </span>
              </div>
            ))}
          </div>

          <p className={styles.infoNote}>
            결과 발표 후 같은 <b>학번과 본인 지정번호</b>로 이 화면에서 결과를 확인할 수 있어요.
            1차 발표는 <b>{recruitConfig.firstResultDate}</b> 예정입니다.
          </p>
        </>
      )}

      {stage === "firstPass" && (
        <>
          <div className={styles.resultCard}>
            <span className={styles.resultLabel}>1차 합격</span>
            <h1 className={styles.resultTitle}>면접에서 만나요!</h1>
            <p className={styles.resultDesc}>
              {result.interview
                ? `면접 시간: ${result.interview}`
                : "면접 시간은 운영진이 곧 안내드립니다."}
            </p>
          </div>
          <p className={styles.infoNote}>
            최종 발표는 <b>{recruitConfig.finalResultDate}</b> 예정입니다.
          </p>
        </>
      )}

      {stage === "firstFail" && (
        <>
          <div className={cn(styles.resultCard, styles.reject)}>
            <span className={styles.resultLabel}>1차 결과 안내</span>
            <h1 className={styles.resultTitle}>
              소중한 지원에
              <br />
              진심으로 감사드립니다
            </h1>
            <p className={styles.resultDesc}>
              아쉽게도 이번 모집에서는 함께하지 못하게 되었습니다.
              <br />
              보내주신 관심에 다시 한번 감사드립니다.
            </p>
          </div>
          <p className={styles.infoNote}>
            제출해 주신 개인정보는 모집 종료 후 관련 법령에 따라 안전하게 파기됩니다.
          </p>
        </>
      )}

      {stage === "finalPass" && (
        <>
          <div className={styles.resultCard}>
            <span className={styles.resultEmblem}>
              <CheckIcon />
            </span>
            <span className={styles.resultLabel}>최종 합격</span>
            <h1 className={styles.resultTitle}>
              해랑사리우의 새 가족이
              <br />
              되어주셔서 감사합니다!
            </h1>
            <p className={styles.resultDesc}>다음 안내는 공식 채널을 통해 전달됩니다.</p>
          </div>

          <div className={styles.nextCard}>
            <p className={styles.nextTitle}>다음 단계</p>
            <ul className={styles.nextList}>
              {nextSteps.map((s, i) => (
                <li key={s} className={styles.nextItem}>
                  <span className={styles.nextNo}>{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <p className={styles.infoNote}>
            개인 연락처 대신 <b>공식 문의 채널</b>을 이용해 주세요.
          </p>
        </>
      )}

      {stage === "finalFail" && (
        <>
          <div className={cn(styles.resultCard, styles.reject)}>
            <span className={styles.resultLabel}>최종 결과 안내</span>
            <h1 className={styles.resultTitle}>
              함께해 주셔서
              <br />
              진심으로 감사했습니다
            </h1>
            <p className={styles.resultDesc}>
              아쉽게도 이번 모집에서는 함께하지 못하게 되었습니다.
              <br />
              면접까지 함께해 주셔서 감사합니다.
            </p>
          </div>
          <p className={styles.infoNote}>
            제출해 주신 개인정보와 면접 기록은 모집 종료 후 관련 법령에 따라 안전하게 파기됩니다.
          </p>
        </>
      )}
    </Shell>
  );
}
