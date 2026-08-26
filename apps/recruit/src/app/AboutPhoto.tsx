import Image from "next/image";
import type { LandingPhoto } from "@/lib/recruit-config";
import styles from "./page.module.css";

/** About 섹션 사진. 관리자 [콘텐츠 관리]에서 올린 사진·위치를 그대로 쓴다. */
export function AboutPhoto({ photo }: { photo: LandingPhoto }) {
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
