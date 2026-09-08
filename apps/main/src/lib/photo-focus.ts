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

function clamp(n: number) {
  return Math.min(100, Math.max(0, n));
}

/**
 * 사진을 끌어 옮긴 만큼 기준점을 움직인다.
 *
 * 끈 거리(px)를 틀의 크기로 나눠 비율로 바꾼다. 사진을 오른쪽으로 끌면
 * 보이는 창은 왼쪽으로 가야 하므로 부호가 뒤집힌다.
 */
export function panFocus(
  focus: PhotoFocus,
  dx: number,
  dy: number,
  width: number,
  height: number,
): PhotoFocus {
  if (width <= 0 || height <= 0) return focus;
  return {
    ...focus,
    x: clamp(focus.x - (dx / width) * 100),
    y: clamp(focus.y - (dy / height) * 100),
  };
}
