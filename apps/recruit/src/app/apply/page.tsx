"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell/Shell";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/Field/Field";
import styles from "./apply.module.css";

export default function IdentifyPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ studentId?: string; code?: string }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};

    if (!/^\d{7}$/.test(studentId.trim())) {
      next.studentId = "학번 7자리를 정확히 입력해 주세요.";
    }
    if (!/^\d{6}$/.test(code.trim())) {
      next.code = "숫자 6자리를 입력해 주세요.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TODO: Supabase — 학번+본인지정번호로 기존 지원 확인 후 분기
    router.push("/apply/form");
  }

  return (
    <Shell title="지원자 확인" back="/">
      <div className={styles.intro}>
        <h1 className={styles.introTitle}>지원 정보를 확인할게요</h1>
        <p className={styles.introDesc}>
          지원 시 사용할 학번과 본인 지정번호를 입력해 주세요. 처음이라면 새로 지원서를 작성하고,
          이미 지원했다면 결과를 확인할 수 있어요.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
          placeholder="숫자 6자리 입력"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
          help="지원자가 직접 정하는 번호입니다. 결과 확인과 면접 시간 선택에 사용돼요."
        />

        <div className={styles.privacyNote}>
          <svg className={styles.lockIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
            <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
          </svg>
          <p className={styles.privacyText}>
            개인정보는 <b>지원 절차 확인 용도</b>로만 사용되며, 운영진 연락처는 직접 노출되지
            않습니다.
          </p>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" fullWidth>
            지원 정보 확인
          </Button>
        </div>
      </form>

      <Link href="/apply/status" className={styles.subLink}>
        이미 지원했나요? 지원 현황 보기
      </Link>
    </Shell>
  );
}
