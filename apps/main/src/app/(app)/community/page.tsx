import { getNotices } from "@/lib/notices";
import { getAlbums } from "@/lib/albums";
import { CommunityBoard } from "./CommunityBoard";

export default async function CommunityPage() {
  const [notices, albums] = await Promise.all([getNotices(), getAlbums()]);
  return <CommunityBoard notices={notices} albums={albums} />;
}
