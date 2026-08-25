"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/Field/Field";
import { Logo } from "@/components/ui/Logo/Logo";
import { createClient } from "@/lib/supabase/client";
import { isValidPassword, studentIdToEmail } from "@/lib/auth";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ studentId?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};

    if (!/^\d{7}$/.test(studentId.trim())) {
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

    // 운영진/관리자 승인 여부는 /admin 레이아웃이 서버에서 다시 확인한다.
    // 여기서 다시 확인하지 않는 이유: 로그인 직후 같은 클라이언트로 바로
    // 조회하면 세션이 자리잡기 전이라 꼬일 수 있어서, 서버 쪽 확인 하나로
    // 통일했다.
    setSubmitting(false);
    // 완전히 새로 요청해야 방금 로그인한 세션 쿠키를 /admin 레이아웃의
    // 서버 확인이 확실히 읽는다 — router.push 는 타이밍에 따라 꼬였었다.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin";
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={56} priority />
          <h1 className={styles.title}>모집 관리자</h1>
          <p className={styles.desc}>운영진 계정으로 로그인해 주세요.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="학번"
            name="studentId"
            required
            placeholder="예: 2026000"
            inputMode="numeric"
            autoComplete="username"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            error={errors.studentId}
          />
          <TextField
            label="비밀번호"
            name="password"
            required
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            help={!errors.password ? "해랑사리우 회원 앱과 같은 계정을 사용합니다." : undefined}
          />

          <Button type="submit" variant="navy" size="lg" fullWidth disabled={submitting}>
            {submitting ? "확인 중..." : "로그인"}
          </Button>
        </form>

        <p className={styles.note}>운영진만 접근할 수 있는 화면입니다.</p>

        <Link href="/" className={styles.back}>
          ‹ 모집 사이트로 돌아가기
        </Link>
      </div>
    </main>
  );
}
