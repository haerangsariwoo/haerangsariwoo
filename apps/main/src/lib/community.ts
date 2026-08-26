import { defaultPhotoFocus, type PhotoFocus } from "./photo-focus";

export interface AlbumPhoto {
  /** 공개 버킷의 사진 주소 */
  url: string;
  /** 스토리지 경로 — 관리자 화면에서 지울 때 쓴다 */
  path?: string;
  focus: PhotoFocus;
}

export type AlbumTone = "sky" | "mint" | "peach" | "lavender";

export interface Album {
  id: string;
  title: string;
  date: string;
  photoCount: number;
  tones: readonly AlbumTone[];
  photos: AlbumPhoto[];
}

const TONES: AlbumTone[] = ["sky", "mint", "peach", "lavender"];

/**
 * 사진이 아직 몇 장 없을 때 빈 자리를 채우는 색 견본.
 * 앨범마다 다르게 보이도록 id 로 시작 위치를 정한다 — 무작위로 하면
 * 다시 그릴 때마다 색이 바뀌어 눈에 거슬린다.
 */
export function tonesFor(id: string): AlbumTone[] {
  const seed = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return TONES.map((_, i) => TONES[(seed + i) % TONES.length]);
}

/**
 * 미리보기 타일 N개를 만든다. 실제 사진이 있으면 그걸 먼저 채우고,
 * 모자란 자리는 색 견본(tone)으로 채운다 — 사진 몇 장 없는 앨범도
 * 목록에서 허전해 보이지 않게 한다.
 */
export function albumPreviewTiles(album: Album, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    photo: album.photos[i],
    tone: album.tones[i % album.tones.length],
  }));
}

export { defaultPhotoFocus };
export type { PhotoFocus };
