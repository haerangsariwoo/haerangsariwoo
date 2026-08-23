import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { cohortLabel, recruitConfig } from "@/lib/recruit-config";
import styles from "./layout.module.css";
import { AdminTitle } from "./AdminTitle";
import { Logo } from "@/components/ui/Logo/Logo";

export const metadata = { title: "모집 관리자 · 해랑사리우" };

export default function RecruitAdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand} aria-label="관리자 홈으로">
          <Logo size={22} className={styles.mascot} priority />
          <span className={styles.wordmark}>해랑사리우</span>
        </Link>
        <p className={styles.season}>
          신규모집 운영
          <b>
            {cohortLabel(recruitConfig.year, recruitConfig.semesterNo)} · {recruitConfig.semester}
          </b>
        </p>

        <AdminNav />

        <div className={styles.profile}>
          <span className={styles.avatar}>재</span>
          <div>
            <p className={styles.profileName}>김재겸</p>
            <p className={styles.profileMeta}>운영진 · 관리자</p>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <AdminTitle />
          <span className={styles.statusPill}>
            {recruitConfig.applicationsOpen ? "접수 중" : "접수 중지"}
          </span>
        </header>

        <div className={styles.content}>
          <p className={styles.mobileNote}>
            모집 관리자는 데스크톱에 최적화되어 있습니다. 명단·심사는 PC에서 이용해 주세요.
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
