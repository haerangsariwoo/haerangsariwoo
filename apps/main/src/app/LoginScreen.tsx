"use client";
import { ThemeToggle } from "@/components/theme/ThemeControls";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/TextField/TextField";
import { createClient } from "@/lib/supabase/client";
import {
  isValidPassword,
  isValidStudentId,
  studentIdToEmail,
} from "@/lib/signup";
import styles from "./page.module.css";

export function LoginScreen({
  localPreview = false,
}: {
  localPreview?: boolean;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    studentId?: string;
    password?: string;
  }>({});
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
      <header className={styles.topbar}>
        <ThemeToggle />
      </header>
      <section className={styles.shell} aria-labelledby="login-heading">
        <div className={styles.intro}>
          <Image className={styles.dolphin} src="/brand/dolphin-hello.webp" width={480} height={480} sizes="100px" alt="" priority />
          <h1 id="login-heading">오늘도 함께,<br />해랑사리우</h1>
          <p>우리의 다음 활동, 여기서 만나요.</p>
        </div>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          aria-busy={submitting}
          noValidate
        >
          <TextField
            label="학번"
            name="studentId"
            className={styles.field}
            placeholder="학번 7자리"
            inputMode="numeric"
            autoComplete="username"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            errorText={errors.studentId}
          />
          <TextField
            label="비밀번호"
            name="password"
            className={styles.field}
            placeholder="비밀번호를 입력해 주세요"
            type="password"
            revealable
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorText={errors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
          >
            {submitting ? "확인 중…" : "로그인"}
          </Button>
        </form>

        <div className={styles.signupRow}>
          <span className={styles.signupText}>아직 부원이 아니신가요?</span>
          <Link href="/signup" className={styles.signupLink}>
            회원가입
          </Link>
        </div>

        <p className={styles.footNote}>
          가입 신청 후 운영진 승인이 필요해요.
        </p>
        {localPreview && (
          <div className={styles.localPreview}>
            <span>로컬 미리보기 <small>저장 기능 제한</small></span>
            <Link href="/home">앱 바로 보기</Link>
            <Link href="/admin">관리자</Link>
          </div>
        )}
        <p className={styles.club}>한성대학교 봉사동아리 해랑사리우</p>
      </section>
    </main>
  );
}
