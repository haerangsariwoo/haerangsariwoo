import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { findAlbum } from "@/lib/albums";
import { getCurrentMember } from "@/lib/get-current-member";
import { AlbumGrid } from "./AlbumGrid";
import { SavePhotos } from "./SavePhotos";
import styles from "./album.module.css";

export default async function AlbumDetailPage({ params }: PageProps<"/community/album/[id]">) {
  const { id } = await params;
  const [item, me] = await Promise.all([findAlbum(id), getCurrentMember()]);
  if (!item) notFound();

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community", label: "커뮤니티" }} />

      <div className={styles.head}>
        {/* 저장 단추는 제목 옆에 — 사진을 다 내려 보기 전에 눈에 들어와야 한다 */}
        <div className={styles.headTop}>
          <h1 className={styles.title}>{item.title}</h1>
          {me && me.role !== "부원" && (
            <Link href={`/community/album/${item.id}/edit`} className={styles.edit}>
              수정
            </Link>
          )}
          <SavePhotos album={item} />
        </div>
        <p className={styles.meta}>
          {item.date}
          {item.photoCount > 0 && ` · 사진 ${item.photoCount}장`}
        </p>
      </div>

      <AlbumGrid album={item} />

      {/* 사진 아래에 글 — 사진을 먼저 보고 설명을 읽는 순서다 */}
      {item.body && <p className={styles.body}>{item.body}</p>}
    </div>
  );
}
