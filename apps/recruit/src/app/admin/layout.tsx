import { AdminShell } from "./AdminShell";

export const metadata = { title: "모집 관리자 · 해랑사리우" };

export default function RecruitAdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
