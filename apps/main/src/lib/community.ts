export type NoticeCategory = "필독" | "일정" | "후기" | "MT";

export interface NoticeItem {
  id: string;
  category: NoticeCategory;
  title: string;
  date: string;
  author: string;
  pinned: boolean;
  body: string[];
}

export const notices: NoticeItem[] = [
  {
    id: "n1",
    category: "필독",
    title: "2학기 정기총회 안내",
    date: "2026.08.18",
    author: "김우영 운영진",
    pinned: true,
    body: [
      "2학기 정기총회를 아래와 같이 진행합니다.",
      "일시: 8월 22일(금) 18:30 / 장소: 미래관 401호",
      "2학기 봉사 일정과 예산안을 함께 확정할 예정이니 전 부원 참석 부탁드립니다.",
    ],
  },
  {
    id: "n2",
    category: "일정",
    title: "신입 부원 교육 일정",
    date: "2026.08.16",
    author: "이서연 운영진",
    pinned: false,
    body: [
      "26-2기 신입 부원 대상 교육을 진행합니다.",
      "봉사 기본 소양 교육과 안전 교육이 포함되며, 교육 이수 후 봉사 신청이 가능합니다.",
    ],
  },
  {
    id: "n3",
    category: "후기",
    title: "여름봉사 활동 후기",
    date: "2026.08.14",
    author: "박민준 운영진",
    pinned: false,
    body: [
      "여름 집중 봉사에 참여해주신 모든 부원께 감사드립니다.",
      "총 42명이 참여해 168시간의 봉사를 함께했습니다.",
    ],
  },
  {
    id: "n4",
    category: "MT",
    title: "26회 MT 준비 안내",
    date: "2026.08.10",
    author: "최하늘 운영진",
    pinned: false,
    body: [
      "9월 MT 준비 사항을 안내드립니다.",
      "조 편성 결과는 출발 일주일 전 앱에서 공개됩니다.",
    ],
  },
];

import { defaultPhotoFocus, type PhotoFocus } from "./photo-focus";

export interface AlbumPhoto {
  url: string;
  focus?: PhotoFocus;
}

export interface Album {
  id: string;
  title: string;
  date: string;
  photoCount: number;
  tones: readonly ("sky" | "mint" | "peach" | "lavender")[];
  /** 실제로 올라온 사진(있는 만큼만) — 나머지는 tones 로 채운 자리표시자다 */
  photos?: AlbumPhoto[];
}

export const albums: Album[] = [
  {
    id: "al1",
    title: "여름 집중 봉사",
    date: "2026.08.14",
    photoCount: 23,
    tones: ["sky", "mint", "peach", "lavender"],
    photos: [
      { url: "/community/album/al1-1.jpg", focus: defaultPhotoFocus },
      { url: "/community/album/al1-2.jpg", focus: defaultPhotoFocus },
      { url: "/community/album/al1-3.jpg", focus: defaultPhotoFocus },
    ],
  },
  {
    id: "al2",
    title: "친해지길 바라 3차",
    date: "2026.08.08",
    photoCount: 31,
    tones: ["mint", "lavender", "sky", "peach"],
    photos: [
      { url: "/community/album/al2-1.jpg", focus: defaultPhotoFocus },
      { url: "/community/album/al2-2.jpg", focus: defaultPhotoFocus },
    ],
  },
  {
    id: "al3",
    title: "한강 플로깅",
    date: "2026.07.26",
    photoCount: 9,
    tones: ["peach", "sky", "mint", "lavender"],
    photos: [
      { url: "/community/album/al3-1.jpg", focus: defaultPhotoFocus },
      { url: "/community/album/al3-2.jpg", focus: defaultPhotoFocus },
    ],
  },
];

/**
 * 미리보기 타일 N개를 만든다. 실제 사진이 있으면 그걸 먼저 채우고,
 * 모자란 자리는 색 견본(tone)으로 채운다 — 실제 사진 몇 장 없이도
 * 그 뒤에 훨씬 더 있는 앨범이라는 느낌을 유지한다.
 */
export function albumPreviewTiles(album: Album, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    photo: album.photos?.[i],
    tone: album.tones[i % album.tones.length],
  }));
}

export function findNotice(id: string) {
  return notices.find((n) => n.id === id);
}

export function findAlbum(id: string) {
  return albums.find((a) => a.id === id);
}
