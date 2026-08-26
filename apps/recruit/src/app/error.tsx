"use client";

import Link from "next/link";
import styles from "./fallback.module.css";

/**
 * 화면을 그리다 오류가 났을 때. Next 기본 화면은 영문이라 지원자가 보면
 * 무슨 일인지 알 수 없어서 우리 말로 바꿔 둔다.
 * 원인은 개발 중에만 보여준다 — 운영에서 내부 사정을 드러낼 이유가 없다.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className={styles.page}>
      <p className={styles.code}>오류</p>
      <h1 className={styles.title}>화면을 불러오지 못했어요</h1>
      <p className={styles.desc}>
        잠시 후 다시 시도해 주세요.
        <br />
        지원서를 넣는 중이었다면 아직 접수되지 않았을 수 있어요.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={reset}>
          다시 시도
        </button>
        <Link href="/" className={styles.secondary}>
          모집 안내로
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <pre className={styles.detail}>
          {error.message}
          {error.digest ? `

digest: ${error.digest}` : ""}
        </pre>
      )}
    </main>
  );
}
