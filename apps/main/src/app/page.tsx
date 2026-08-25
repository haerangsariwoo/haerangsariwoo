"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/TextField/TextField";
import { createClient } from "@/lib/supabase/client";
import { isValidPassword, isValidStudentId, studentIdToEmail } from "@/lib/signup";
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
      next.password = "비밀번호를 입력해 주세요.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: studentIdToEmail(studentId.trim()),
      password,
    });

    if (error || !data.user) {
      setSubmitting(false);
      setErrors({ password: "학번 또는 비밀번호가 올바르지 않습니다." });
      return;
    }

    const { data: memberRow } = await supabase
      .from("members")
      .select("status")
      .eq("id", data.user.id)
      .single();

    if (memberRow?.status !== "approved") {
      await supabase.auth.signOut();
      setSubmitting(false);
      setErrors({
        password:
          memberRow?.status === "rejected"
            ? "가입이 반려되었습니다. 운영진에게 문의해 주세요."
            : "아직 운영진 승인 대기 중입니다.",
      });
      return;
    }

    setSubmitting(false);
    router.push("/home");
    router.refresh();
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
            placeholder="비밀번호"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorText={errors.password}
            helperText={!errors.password ? "회원가입 때 정한 비밀번호입니다." : undefined}
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
