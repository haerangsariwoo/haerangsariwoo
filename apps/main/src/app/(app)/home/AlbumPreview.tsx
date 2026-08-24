"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { albumPreviewTiles, albums as albumsSeed, type Album } from "@/lib/community";
import { useContentOverride } from "@/lib/content-store";
import { defaultPhotoFocus } from "@/lib/photo-focus";
import styles from "./home.module.css";

/** 가장 최근 앨범의 사진 몇 장을 미리 보여준다. 관리자 저장 값이 있으면 그걸 쓴다. */
export function AlbumPreview() {
  const albums = useContentOverride<Album[]>("albums", albumsSeed);
  const latest = albums[0];
  if (!latest) return null;

  return (
    <div className={styles.albumGrid}>
      {albumPreviewTiles(latest, 4).map((tile, i) => {
        const focus = tile.photo?.focus ?? defaultPhotoFocus;
        return (
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
