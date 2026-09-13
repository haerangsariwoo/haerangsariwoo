import { getNotices } from "@/lib/notices";
import { getAlbums } from "@/lib/albums";
import { getAnonPosts } from "@/lib/anon-posts";
import { getCurrentMember } from "@/lib/get-current-member";
import { CommunityBoard } from "./CommunityBoard";

export default async function CommunityPage() {
  const [notices, albums, anonPosts, me] = await Promise.all([
    getNotices(),
    getAlbums(),
    getAnonPosts(),
    getCurrentMember(),
  ]);
  // 공지·앨범은 운영진만 쓴다 — 부원에게는 단추 자체를 보이지 않는다.
  // 익명게시판은 누구나 쓴다.
  return (
    <CommunityBoard
      notices={notices}
      albums={albums}
      anonPosts={anonPosts}
      canPost={me?.role !== "부원"}
    />
  );
}
