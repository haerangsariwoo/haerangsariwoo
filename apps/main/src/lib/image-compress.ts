"use client";

/**
 * 사진을 올리기 전에 브라우저에서 줄인다.
 *
 * 요즘 폰 사진은 한 장에 3~5MB라, 그대로 올리면 무료 저장 용량을 한 학기에
 * 넘긴다. 서버를 거치지 않고 브라우저에서 처리하므로 비용이 들지 않고,
 * 업로드도 빨라지고, 부원들 데이터 요금도 아낀다.
 *
 * 용도마다 필요한 화질이 다르다:
 *  - 증빙: 확인서 글자가 읽히면 되는 대조용. 작게 줄여도 지장이 없다.
 *  - 앨범: 부원들이 내려받아 간직하는 사진. 화질을 지켜야 한다.
 */

export interface CompressPreset {
  /** 긴 변 기준 최대 픽셀 */
  maxEdge: number;
  /** JPEG 품질 (0~1) */
  quality: number;
}

/** 봉사 증빙 — 인증서를 알아볼 수 있으면 되는 용도 */
export const PROOF_PRESET: CompressPreset = { maxEdge: 1600, quality: 0.8 };

/** 활동 앨범 — 부원들이 내려받는 사진이라 넉넉히 남긴다 */
export const ALBUM_PRESET: CompressPreset = { maxEdge: 2560, quality: 0.92 };

/** 프로필·게시판 첨부 — 화면에서 보는 용도 */
export const SCREEN_PRESET: CompressPreset = { maxEdge: 1600, quality: 0.85 };

/**
 * 앨범 격자에 깔리는 작은 그림.
 * 칸이 220px 이라 400px 이면 고해상도 화면에서도 또렷하다. 원본을 그대로
 * 깔면 20장짜리 앨범 한 번 여는 데 17MB 가 나간다.
 */
export const THUMB_PRESET: CompressPreset = { maxEdge: 400, quality: 0.78 };

/** 원본이 아무리 커도 이 이상은 받지 않는다 (사고 방지) */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export class FileTooLargeError extends Error {
  constructor() {
    super("사진 한 장은 20MB까지 올릴 수 있어요.");
    this.name = "FileTooLargeError";
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽지 못했습니다."));
    };
    img.src = url;
  });
}

/** 확장자를 .jpg 로 바꾼다 — 줄인 결과는 항상 JPEG 이다 */
function toJpegName(name: string) {
  return `${name.replace(/\.[^.]+$/, "")}.jpg`;
}

/**
 * 사진을 줄여서 돌려준다. 이미 충분히 작거나 줄여도 커지면 원본을 그대로 쓴다
 * — 작은 PNG 를 JPEG 로 바꾸면 오히려 커지는 경우가 있다.
 */
export async function compressImage(file: File, preset: CompressPreset): Promise<File> {
  if (file.size > MAX_UPLOAD_BYTES) throw new FileTooLargeError();

  // GIF 는 움직임이 사라지고, SVG 는 줄일 이유가 없다
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  const img = await loadImage(file);
  const scale = Math.min(1, preset.maxEdge / Math.max(img.width, img.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", preset.quality),
  );
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], toJpegName(file.name), { type: "image/jpeg" });
}

/** 여러 장을 차례로 줄인다 — 한꺼번에 하면 큰 사진에서 메모리가 튄다 */
export async function compressAll(files: File[], preset: CompressPreset): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) out.push(await compressImage(f, preset));
  return out;
}
