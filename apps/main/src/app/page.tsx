"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/TextField/TextField";
import { isValidPassword, isValidStudentId } from "@/lib/signup";
import styles from "./page.module.css";
import { Logo } from "@/components/ui/Logo/Logo";

const IdCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="8.5" cy="11" r="1.8" />
    <path d="M6.5 15.5c.4-1.4 1.4-2 2-2s1.6.6 2 2M13.5 9.5h5M13.5 13.5h5" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ studentId?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};

    if (!isValidStudentId(studentId.trim())) {
      next.studentId = "학번 7자리를 정확히 입력해 주세요.";
    }
    if (!isValidPassword(password.trim())) {
      next.password = "비밀번호 4자리를 입력해 주세요.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // TODO: Supabase Auth — 학번 + 비밀번호로 인증하고, 승인된 회원만 통과시킨다
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    router.push("/home");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.brand}>
          <Logo size={62} className={styles.mascot} priority />
          <p className={styles.tagline}>학번과 비밀번호로 로그인하세요</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="학번"
            name="studentId"
            icon={<IdCardIcon />}
            placeholder="예: 2026000"
            inputMode="numeric"
            autoComplete="username"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            errorText={errors.studentId}
          />
          <TextField
            label="비밀번호"
            name="password"
            icon={<LockIcon />}
            placeholder="숫자 4자리"
            inputMode="numeric"
            type="password"
            maxLength={4}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorText={errors.password}
            helperText={!errors.password ? "회원가입 때 정한 숫자 4자리입니다." : undefined}
          />

          <Button type="submit" variant="navy" size="lg" fullWidth disabled={submitting}>
            {submitting ? "확인 중..." : "로그인"}
          </Button>
        </form>

        <div className={styles.signupRow}>
          <span className={styles.signupText}>아직 부원이 아니신가요?</span>
          <Link href="/signup" className={styles.signupLink}>
            회원가입
          </Link>
        </div>

        <p className={styles.footNote}>
          가입 신청 후 운영진 승인이 완료되면 로그인할 수 있습니다.
          <br />
          신입 부원 모집은 별도 모집 페이지를 이용해 주세요.
        </p>
      </div>
    </main>
  );
}
