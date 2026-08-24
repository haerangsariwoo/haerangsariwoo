import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { albums, findAlbum } from "@/lib/community";
import { AlbumPhotoGrid } from "./AlbumPhotoGrid";
import styles from "./album.module.css";

export function generateStaticParams() {
  return albums.map((a) => ({ id: a.id }));
}

export default async function AlbumDetailPage({ params }: PageProps<"/community/album/[id]">) {
  const { id } = await params;
  const item = findAlbum(id);
  if (!item) notFound();

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community", label: "커뮤니티" }} />

      <div className={styles.head}>
        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.meta}>
          {item.date} · 사진 {item.photoCount}장
        </p>
      </div>

      <AlbumPhotoGrid albumId={id} seed={item} />
    </div>
  );
}
