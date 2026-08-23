"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/TextField/TextField";
import {
  MBTI_TYPES,
  TRACKS,
  isValidBirth,
  isValidStudentId,
  type Gender,
} from "@/lib/signup";
import styles from "./signup.module.css";

interface Values {
  name: string;
  gender: Gender | null;
  track: string;
  studentId: string;
  birth: string;
  mbti: string | null;
}

export default function SignupPage() {
  const [v, setV] = useState<Values>({
    name: "",
    gender: null,
    track: "",
    studentId: "",
    birth: "",
    mbti: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};

    if (!v.name.trim()) next.name = "이름을 입력해 주세요.";
    if (!v.gender) next.gender = "성별을 선택해 주세요.";
    if (!v.track) next.track = "트랙(학과)을 선택해 주세요.";
    if (!isValidStudentId(v.studentId.trim())) next.studentId = "학번 7자리를 정확히 입력해 주세요.";
    if (!isValidBirth(v.birth.trim())) next.birth = "생년월일 6자리를 정확히 입력해 주세요.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TODO: Supabase — signup_requests 에 저장하고 운영진 승인을 기다린다
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (done) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.doneWrap}>
            <span className={styles.doneIcon}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </span>
            <h1 className={styles.doneTitle}>가입 신청이 접수됐어요</h1>
            <p className={styles.doneDesc}>
              운영진이 확인한 뒤 승인하면 로그인할 수 있어요.
              <br />
              승인까지 보통 며칠 정도 걸립니다.
            </p>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>이름</span>
                <span className={styles.summaryValue}>{v.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>성별</span>
                <span className={styles.summaryValue}>{v.gender}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>트랙</span>
                <span className={styles.summaryValue}>{v.track}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>학번</span>
                <span className={styles.summaryValue}>{v.studentId}</span>
              </div>
              {v.mbti && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>MBTI</span>
                  <span className={styles.summaryValue}>{v.mbti}</span>
                </div>
              )}
            </div>

            <p className={styles.note}>
              로그인은 <b>학번</b>과 <b>생년월일 6자리</b>로 합니다. 승인 후 이용해 주세요.
            </p>

            <Link href="/" style={{ width: "100%" }}>
              <Button variant="navy" size="lg" fullWidth>
                로그인 화면으로
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.head}>
          <Link href="/" className={styles.backLink}>
            ‹ 로그인
          </Link>
          <h1 className={styles.title}>회원가입</h1>
          <p className={styles.desc}>
            아래 정보를 입력하면 운영진이 확인 후 승인해 드려요.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="이름"
            name="name"
            placeholder="이름을 입력해 주세요"
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            errorText={errors.name}
          />

          <div className={styles.field}>
            <span className={styles.label}>성별</span>
            <div className={styles.genderRow} role="group" aria-label="성별 선택">
              {(["남", "여"] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={v.gender === g}
                  className={cn(styles.genderBtn, v.gender === g && styles.on)}
                  onClick={() => set("gender", g)}
                >
                  {g}
                </button>
              ))}
            </div>
            {errors.gender && <p className={styles.errorText}>{errors.gender}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="track">
              트랙 (학과)
            </label>
            <select
              id="track"
              className={cn(
                styles.select,
                !v.track && styles.placeholder,
                errors.track && styles.invalid,
              )}
              value={v.track}
              onChange={(e) => set("track", e.target.value)}
            >
              <option value="">트랙을 선택해 주세요</option>
              {TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.track && <p className={styles.errorText}>{errors.track}</p>}
          </div>

          <TextField
            label="학번"
            name="studentId"
            placeholder="예: 2026000"
            inputMode="numeric"
            value={v.studentId}
            onChange={(e) => set("studentId", e.target.value)}
            errorText={errors.studentId}
            helperText={!errors.studentId ? "로그인할 때 아이디로 사용됩니다." : undefined}
          />

          <TextField
            label="생년월일 6자리"
            name="birth"
            placeholder="예: 060312"
            inputMode="numeric"
            maxLength={6}
            value={v.birth}
            onChange={(e) => set("birth", e.target.value)}
            errorText={errors.birth}
            helperText={!errors.birth ? "로그인할 때 비밀번호로 사용됩니다." : undefined}
          />

          <div className={styles.field}>
            <span className={styles.label}>
              MBTI
              <span className={styles.optional}>선택</span>
            </span>
            <div className={styles.mbtiGrid} role="group" aria-label="MBTI 선택">
              {MBTI_TYPES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={v.mbti === m}
                  className={cn(styles.mbtiBtn, v.mbti === m && styles.on)}
                  onClick={() => set("mbti", v.mbti === m ? null : m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className={styles.helper}>
              조 편성이나 친목 활동에 참고합니다. 입력하지 않아도 괜찮아요.
            </p>
          </div>

          <p className={styles.note}>
            입력한 정보는 부원 관리 목적으로만 사용되며, 운영진 승인 후 로그인할 수 있습니다.
          </p>

          <Button type="submit" variant="navy" size="lg" fullWidth>
            가입 신청하기
          </Button>
        </form>
      </div>
    </main>
  );
}
