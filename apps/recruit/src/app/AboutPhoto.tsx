"use client";

import Image from "next/image";
import { useContentOverride } from "@/lib/content-store";
import { defaultPhotoFocus, type PhotoFocus } from "@/lib/recruit-config";
import styles from "./page.module.css";

const DEFAULT_SRC = "/landing/about-photo.avif";

interface AboutPhotoData {
  photoUrl: string;
  focus: PhotoFocus;
}

const seed: AboutPhotoData = { photoUrl: DEFAULT_SRC, focus: defaultPhotoFocus };

/** About 섹션 사진. 관리자 페이지에서 저장한 사진·위치가 있으면 그 값을 쓴다. */
export function AboutPhoto() {
  const photo = useContentOverride<AboutPhotoData>("aboutPhoto", seed);

  return (
    <div className={styles.aboutPhoto}>
      <Image
        className={styles.aboutPhotoImage}
        src={photo.photoUrl}
        alt="해랑사리우 활동 사진"
        fill
        sizes="(min-width: 1200px) 560px, 100vw"
        unoptimized
        style={{
          objectPosition: `${photo.focus.x}% ${photo.focus.y}%`,
          transform: `scale(${photo.focus.zoom})`,
          transformOrigin: `${photo.focus.x}% ${photo.focus.y}%`,
        }}
      />
    </div>
  );
}
