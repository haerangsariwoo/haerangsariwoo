import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/get-current-member";
import { NoticeComposer } from "../NoticeComposer";

/**
 * 공지 쓰기.
 *
 * 단추를 감추는 것만으로는 막은 것이 아니다 — 주소를 직접 치면 들어온다.
 * 여기서 한 번 더 본다.
 */
export default async function NewNoticePage() {
  const me = await getCurrentMember();
  if (!me) redirect("/");
  if (me.role === "부원") redirect("/community");

  return <NoticeComposer />;
}
