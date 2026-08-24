"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell/Shell";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/Field/Field";
import { saveStudentId } from "@/lib/apply-session";
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

    // 2단계에서 다시 묻지 않도록 학번을 넘긴다 (본인 지정번호는 저장하지 않는다)
    saveStudentId(studentId.trim());

    // TODO: Supabase — 학번+본인지정번호로 기존 지원 확인 후 분기
    router.push("/apply/form");
  }

  return (
    <Shell title="지원자 확인" back="/">
      <div className={styles.intro}>
        <h1 className={styles.introTitle}>지원 정보를 확인할게요</h1>
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
        />

        <div className={styles.warnNote}>
          <span className={styles.warnIcon} aria-hidden="true">
            !
          </span>
          <p className={styles.warnText}>
            <span className={styles.warnTitle}>본인 지정번호를 꼭 기억해 주세요.</span>
            앞으로 <b>결과 확인</b>과 <b>면접 시간 선택</b>에 계속 사용됩니다. 운영진도 번호를 대신
            확인해 드릴 수 없으니 분실하지 않도록 주의해 주세요.
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
