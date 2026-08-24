import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { AdminTopbar } from "./AdminTopbar";
import { ReadOnlyNotice } from "./ReadOnlyNotice";
import { SemesterProvider } from "./SemesterContext";
import "./admin-tokens.css";
import styles from "./layout.module.css";
import { Logo } from "@/components/ui/Logo/Logo";

export const metadata = {
  title: "운영진 관리자 · 해랑사리우",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <SemesterProvider>
      <div className={`adminScope ${styles.shell}`}>
        <aside className={styles.sidebar}>
          <Link href="/admin" className={styles.brand} aria-label="관리자 홈으로">
            <Logo size={40} src="/logo-admin.avif" className={styles.mascot} priority />
            <span className={styles.adminTag}>ADMIN</span>
          </Link>

          <AdminNav />

          <div className={styles.profile}>
            <span className={styles.avatar}>우</span>
            <div>
              <p className={styles.profileName}>김우영 운영진</p>
              <p className={styles.profileMeta}>24-1기 관리자</p>
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
            <ReadOnlyNotice />
            {children}
          </div>
        </div>
      </div>
    </SemesterProvider>
  );
}
