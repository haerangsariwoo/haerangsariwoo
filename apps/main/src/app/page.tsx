"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/TextField/TextField";
import styles from "./page.module.css";
import { Logo } from "@/components/ui/Logo/Logo";

const IdCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="8.5" cy="11" r="1.8" />
    <path d="M6.5 15.5c.4-1.4 1.4-2 2-2s1.6.6 2 2M13.5 9.5h5M13.5 13.5h5" />
  </svg>
);

const KeyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="16" r="4" />
    <path d="M10.8 13.2 18 6l2.2 2.2M15.5 8.5l2 2" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentId.trim() || !memberCode.trim()) {
      setError("학번과 식별번호를 모두 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    // TODO: Supabase Auth 연동 — 학번+관리자 부여 식별번호를 커스텀 인증으로 검증
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    router.push("/home");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.brand}>
          <Logo size={64} className={styles.mascot} priority />
          <h1 className={styles.wordmark}>해랑사리우</h1>
          <p className={styles.tagline}>학번과 식별번호로 로그인하세요</p>
          <span className={styles.badge}>정상</span>
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
          />
          <TextField
            label="관리자 부여 식별번호"
            name="memberCode"
            icon={<KeyIcon />}
            placeholder="숫자 6자리"
            inputMode="numeric"
            type="password"
            autoComplete="current-password"
            value={memberCode}
            onChange={(e) => setMemberCode(e.target.value)}
            errorText={error || undefined}
          />

          <p className={styles.note}>
            식별번호는 운영진이 회원 등록 시 발급합니다. 분실 시 운영진에게 문의해 주세요.
          </p>

          <Button type="submit" variant="navy" size="lg" fullWidth disabled={submitting}>
            {submitting ? "확인 중..." : "로그인"}
          </Button>
        </form>

        <p className={styles.footNote}>
          해랑사리우 회원 전용 앱입니다.
          <br />
          신입 부원 모집은 별도 모집 페이지를 이용해 주세요.
        </p>
      </div>
    </main>
  );
}
