import Image from "next/image";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { findAlbum } from "@/lib/albums";
import { albumPreviewTiles } from "@/lib/community";
import styles from "./album.module.css";

export default async function AlbumDetailPage({ params }: PageProps<"/community/album/[id]">) {
  const { id } = await params;
  const item = await findAlbum(id);
  if (!item) notFound();

  // 사진이 4장이 안 돼도 격자가 허전하지 않게 최소 4칸은 채운다
  const tiles = albumPreviewTiles(item, Math.max(item.photoCount, 4));

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
        {tiles.map((tile, i) => (
          <span key={i} className={cn(styles.photo, !tile.photo && styles[tile.tone])}>
            {tile.photo && (
              <Image
                className={styles.photoImage}
                src={tile.photo.url}
                alt=""
                fill
                sizes="(min-width: 480px) 220px, 45vw"
                unoptimized
                style={{
                  objectPosition: `${tile.photo.focus.x}% ${tile.photo.focus.y}%`,
                  transform: `scale(${tile.photo.focus.zoom})`,
                  transformOrigin: `${tile.photo.focus.x}% ${tile.photo.focus.y}%`,
                }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
