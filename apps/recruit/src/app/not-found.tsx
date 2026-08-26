import Link from "next/link";
import styles from "./fallback.module.css";

export const metadata = { title: "페이지를 찾을 수 없어요 · 해랑사리우" };

export default function NotFound() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
      <p className={styles.desc}>
        주소가 바뀌었거나, 모집이 끝난 페이지일 수 있어요.
      </p>
      <div className={styles.actions}>
        <Link href="/" className={styles.primary}>
          모집 안내로
        </Link>
      </div>
    </main>
  );
}
