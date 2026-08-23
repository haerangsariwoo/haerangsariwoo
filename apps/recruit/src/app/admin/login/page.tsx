"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/Field/Field";
import { Logo } from "@/components/ui/Logo/Logo";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
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
    if (!/^\d{4}$/.test(password.trim())) {
      next.password = "비밀번호 4자리를 입력해 주세요.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // TODO: Supabase Auth — 회원 앱과 같은 계정으로 인증하고 운영진만 통과시킨다
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    router.push("/admin");
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
            placeholder="숫자 4자리"
            inputMode="numeric"
            maxLength={4}
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
