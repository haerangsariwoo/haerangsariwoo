import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { AdminTopbar } from "./AdminTopbar";
import "./admin-tokens.css";
import styles from "./layout.module.css";
import { Logo } from "@/components/ui/Logo/Logo";

export const metadata = {
  title: "운영진 관리자 · 해랑사리우",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={`adminScope ${styles.shell}`}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo size={26} className={styles.mascot} priority />
          <span className={styles.wordmark}>해랑사리우</span>
          <span className={styles.adminTag}>ADMIN</span>
        </div>

        <AdminNav />

        <div className={styles.profile}>
          <span className={styles.avatar}>우</span>
          <div>
            <p className={styles.profileName}>김우영 운영진</p>
            <p className={styles.profileMeta}>26기 · 관리자</p>
          </div>
        </div>

        <Link href="/home" className={styles.backToApp}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 6l-6 6 6 6" />
          </svg>
          회원 앱으로 돌아가기
        </Link>
      </aside>

      <div className={styles.main}>
        <AdminTopbar />
        <div className={styles.content}>
          <p className={styles.mobileNote}>
            관리자 화면은 데스크톱에 최적화되어 있습니다. 표와 일괄 처리는 PC에서 이용해 주세요.
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
