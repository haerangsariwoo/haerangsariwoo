/**
 * 고정 비율 박스에 사진을 올릴 때 어느 부분이 보일지 정하는 값.
 * x·y 는 기준점 위치(%), zoom 은 그 지점을 중심으로 한 확대 배율.
 */
export interface PhotoFocus {
  x: number;
  y: number;
  zoom: number;
}

export const defaultPhotoFocus: PhotoFocus = { x: 50, y: 50, zoom: 1 };
