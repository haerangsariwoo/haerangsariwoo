import { getNotices } from "@/lib/notices";
import { getAlbums } from "@/lib/albums";
import { getCurrentMember } from "@/lib/get-current-member";
import { CommunityBoard } from "./CommunityBoard";

export default async function CommunityPage() {
  const [notices, albums, me] = await Promise.all([getNotices(), getAlbums(), getCurrentMember()]);
  // 글은 운영진만 쓴다 — 부원에게는 단추 자체를 보이지 않는다
  return <CommunityBoard notices={notices} albums={albums} canPost={me?.role !== "부원"} />;
}
