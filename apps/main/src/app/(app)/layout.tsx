import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav/BottomNav";
import { ServiceWorkerSetup } from "@/components/push/ServiceWorkerSetup/ServiceWorkerSetup";
import { getCurrentMember } from "@/lib/get-current-member";
import styles from "./layout.module.css";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getCurrentMember();
  if (!profile) redirect("/");

  return (
    <div className={styles.shell}>
      <ServiceWorkerSetup />
      <AppHeader profile={profile} />
      <div className={styles.content}>{children}</div>
      <BottomNav />
    </div>
  );
}
