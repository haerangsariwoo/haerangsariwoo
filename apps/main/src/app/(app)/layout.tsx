import { AppHeader } from "@/components/layout/AppHeader/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav/BottomNav";
import styles from "./layout.module.css";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <div className={styles.content}>{children}</div>
      <BottomNav />
    </div>
  );
}
