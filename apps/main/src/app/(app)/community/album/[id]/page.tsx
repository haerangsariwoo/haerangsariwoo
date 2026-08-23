import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { albums, findAlbum } from "@/lib/community";
import styles from "./album.module.css";

export function generateStaticParams() {
  return albums.map((a) => ({ id: a.id }));
}

export default async function AlbumDetailPage({ params }: PageProps<"/community/album/[id]">) {
  const { id } = await params;
  const item = findAlbum(id);
  if (!item) notFound();

  const photos = Array.from({ length: item.photoCount }, (_, i) => item.tones[i % item.tones.length]);

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community", label: "커뮤니티" }} />

      <div className={styles.head}>
        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.meta}>
          {item.date} · 사진 {item.photoCount}장
        </p>
      </div>

      <div className={styles.grid}>
        {photos.map((tone, i) => (
          <span key={i} className={cn(styles.photo, styles[tone])} />
        ))}
      </div>

    </div>
  );
}
