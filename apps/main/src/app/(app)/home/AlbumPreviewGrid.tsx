import Image from "next/image";
import Link from "next/link";
import type { Album } from "@/lib/community";
import styles from "./AlbumPreview.module.css";

/** The data loader stays separate so populated and missing-cover states can be tested. */
export function AlbumPreviewGrid({ albums }: { albums: Album[] }) {
  if (!albums.length) {
    return <p className={styles.empty}>아직 올라온 사진이 없어요.</p>;
  }
  return (
    <div className={styles.grid}>
      {albums.slice(0, 4).map((post) => {
        const cover = post.photos[0];
        return (
          <Link
            key={post.id}
            href={`/community/album/${post.id}`}
            className={styles.item}
            aria-label={post.title}
          >
            <span className={styles.photo}>
              {cover?.url ? (
                <Image
                  className={styles.image}
                  src={cover.url}
                  alt=""
                  fill
                  sizes="(max-width: 480px) 22vw, 96px"
                  unoptimized
                  style={{
                    objectPosition: `${cover.focus.x}% ${cover.focus.y}%`,
                    transform: `scale(${cover.focus.zoom})`,
                    transformOrigin: `${cover.focus.x}% ${cover.focus.y}%`,
                  }}
                />
              ) : (
                <span className={styles.placeholder}>사진 준비 중</span>
              )}
            </span>
            <span className={styles.title}>{post.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
