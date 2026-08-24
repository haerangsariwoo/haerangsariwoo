"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { albumPreviewTiles, albums as albumsSeed, type Album } from "@/lib/community";
import { useContentOverride } from "@/lib/content-store";
import { defaultPhotoFocus } from "@/lib/photo-focus";
import styles from "./album.module.css";

/**
 * 관리자 페이지에서 저장한 사진이 있으면 그 값으로, 없으면 서버가 넘긴
 * 시드 앨범으로 그린다. photoCount 만큼 타일을 만들고, 실제 사진이
 * 있는 자리는 사진으로, 나머지는 색 견본으로 채운다.
 */
export function AlbumPhotoGrid({ albumId, seed }: { albumId: string; seed: Album }) {
  const albums = useContentOverride<Album[]>("albums", albumsSeed);
  const item = albums.find((a) => a.id === albumId) ?? seed;
  const tiles = albumPreviewTiles(item, item.photoCount);

  return (
    <div className={styles.grid}>
      {tiles.map((tile, i) => {
        const focus = tile.photo?.focus ?? defaultPhotoFocus;
        return (
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
                  objectPosition: `${focus.x}% ${focus.y}%`,
                  transform: `scale(${focus.zoom})`,
                  transformOrigin: `${focus.x}% ${focus.y}%`,
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
