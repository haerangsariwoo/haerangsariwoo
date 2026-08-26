import Image from "next/image";
import { cn } from "@/lib/cn";
import { albumPreviewTiles } from "@/lib/community";
import { getAlbums } from "@/lib/albums";
import styles from "./home.module.css";

/** 가장 최근 앨범의 사진 몇 장을 미리 보여준다 */
export async function AlbumPreview() {
  const albums = await getAlbums();
  const latest = albums[0];
  if (!latest) return <p className={styles.albumEmpty}>아직 올라온 사진이 없어요.</p>;

  return (
    <div className={styles.albumGrid}>
      {albumPreviewTiles(latest, 4).map((tile, i) => (
        <span key={i} className={cn(styles.photo, !tile.photo && styles[tile.tone])}>
          {tile.photo && (
            <Image
              className={styles.photoImage}
              src={tile.photo.url}
              alt=""
              fill
              sizes="180px"
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
  );
}
