import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/get-current-member";
import { AlbumComposer } from "./AlbumComposer";

/**
 * 게시글 쓰기.
 *
 * 단추를 감추는 것만으로는 막은 것이 아니다 — 주소를 직접 치면 들어온다.
 * 여기서 한 번 더 본다.
 */
export default async function NewAlbumPage() {
  const me = await getCurrentMember();
  if (!me) redirect("/");
  if (me.role === "부원") redirect("/community?tab=앨범");

  return <AlbumComposer />;
}
