import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "모집 설정 · 해랑사리우" };

export default function RecruitSettingsPage() {
  // 랜딩 활동 사진은 [랜딩 콘텐츠] 화면에서 관리한다. 여기서 중복으로 두지 않는다.
  return <SettingsForm />;
}
