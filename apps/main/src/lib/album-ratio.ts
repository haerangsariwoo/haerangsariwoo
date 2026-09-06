/**
 * 게시글에서 사진을 보여줄 틀의 비율.
 *
 * 한 게시글 안의 사진은 크기가 제각각이라 그대로 두면 넘길 때마다 화면이
 * 들썩인다. 그래서 게시글마다 틀 하나를 정하고 그 안에 맞춰 잘라 보여준다.
 * 세로 사진이 많은 날은 세로로, 단체 사진이 많은 날은 가로로 두면 된다.
 */
export const ALBUM_RATIOS = [
  { value: "1:1", label: "정사각형", css: "1 / 1" },
  { value: "4:5", label: "세로", css: "4 / 5" },
  { value: "16:9", label: "가로", css: "16 / 9" },
] as const;

export type AlbumRatio = (typeof ALBUM_RATIOS)[number]["value"];

export const DEFAULT_ALBUM_RATIO: AlbumRatio = "1:1";

/** DB 에 뭐가 들어 있든 화면이 깨지지 않게 아는 값만 통과시킨다 */
export function toAlbumRatio(value: string | null | undefined): AlbumRatio {
  return ALBUM_RATIOS.some((r) => r.value === value)
    ? (value as AlbumRatio)
    : DEFAULT_ALBUM_RATIO;
}

export function albumRatioCss(value: AlbumRatio): string {
  return (ALBUM_RATIOS.find((r) => r.value === value) ?? ALBUM_RATIOS[0]).css;
}

/** "세로 (4:5)" 처럼 사람이 읽는 이름 */
export function ratioLabel(value: AlbumRatio): string {
  const found = ALBUM_RATIOS.find((r) => r.value === value) ?? ALBUM_RATIOS[0];
  return `${found.label} (${found.value})`;
}
