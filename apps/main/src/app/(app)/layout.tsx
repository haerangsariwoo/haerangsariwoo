import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav/BottomNav";
import { AppTourProvider } from "@/components/onboarding/AppTour";
import { FirstVisitSetup } from "@/components/onboarding/FirstVisitSetup";
import { ServiceWorkerSetup } from "@/components/push/ServiceWorkerSetup/ServiceWorkerSetup";
import { getCurrentMember } from "@/lib/get-current-member";
import { isLocalAdminBypass, LOCAL_ADMIN_MEMBER } from "@/lib/local-admin";
import styles from "./layout.module.css";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = isLocalAdminBypass()
    ? LOCAL_ADMIN_MEMBER
    : await getCurrentMember();
  if (!profile) redirect("/");

  return (
    <AppTourProvider>
      <div className={styles.shell}>
        <ServiceWorkerSetup />
        <AppHeader profile={profile} />
        <main className={styles.content}>{children}</main>
        <BottomNav />
      </div>
      <FirstVisitSetup />
    </AppTourProvider>
  );
}
