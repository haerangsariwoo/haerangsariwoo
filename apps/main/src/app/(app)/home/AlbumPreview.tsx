import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { tonesFor } from "@/lib/community";
import { getAlbums } from "@/lib/albums";
import styles from "./home.module.css";

/**
 * 최근 게시글 넷을 대표 사진 한 장씩으로 보여준다.
 *
 * 예전에는 가장 최근 게시글 하나의 사진 넉 장을 깔았는데, 그러면 그 하나만
 * 계속 보이고 새 글이 올라온 줄도 모른다. 넷을 나란히 두면 홈만 봐도
 * 무엇이 새로 올라왔는지 알 수 있다.
 */
export async function AlbumPreview() {
  const albums = await getAlbums();
  const recent = albums.slice(0, 4);

  if (recent.length === 0) {
    return <p className={styles.albumEmpty}>아직 올라온 사진이 없어요.</p>;
  }

  // 넷이 안 되면 빈 자리를 색 견본으로 채운다 — 격자가 허전해 보이지 않게
  const tones = tonesFor("home");

  return (
    <div className={styles.albumGrid}>
      {Array.from({ length: 4 }, (_, i) => {
        const post = recent[i];
        const cover = post?.photos[0];

        if (!post) {
          return <span key={i} className={cn(styles.photo, styles[tones[i % tones.length]])} />;
        }

        return (
          <Link
            key={post.id}
            href={`/community/album/${post.id}`}
            className={cn(styles.photo, !cover && styles[tones[i % tones.length]])}
            aria-label={post.title}
          >
            {cover && (
              <Image
                className={styles.photoImage}
                src={cover.url}
                alt=""
                fill
                sizes="180px"
                unoptimized
                style={{
                  objectPosition: `${cover.focus.x}% ${cover.focus.y}%`,
                  transform: `scale(${cover.focus.zoom})`,
                  transformOrigin: `${cover.focus.x}% ${cover.focus.y}%`,
                }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
