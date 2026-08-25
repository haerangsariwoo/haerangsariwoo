import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { getCurrentMember } from "@/lib/get-current-member";
import { AccountForm } from "./AccountForm";
import styles from "./account.module.css";

export const metadata = { title: "계정 설정 · 해랑사리우" };

export default async function AccountPage() {
  const profile = await getCurrentMember();
  if (!profile) redirect("/");

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/my", label: "MY" }} />
      <AccountForm track={profile.track} />
    </div>
  );
}
