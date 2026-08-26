/**
 * 게시글 본문에 사진을 적어 두는 방식.
 * `![이름|너비](저장경로)` 한 줄이 사진 한 장이다. 너비는 글 폭 대비 %,
 * 없으면 100 으로 본다. 본문이 그냥 글자라서 저장·검색·수정이 단순하고,
 * 쓰는 사람도 무슨 일이 벌어지는지 눈으로 볼 수 있다.
 */

export const IMAGE_LINE = /^!\[([^\]|]*)(?:\|(\d{1,3}))?\]\(([^)]+)\)$/;

export interface BodyImage {
  alt: string;
  width: number;
  src: string;
}

export type BodyBlock = { kind: "text"; text: string } | ({ kind: "image" } & BodyImage);

export function imageMarkdown(alt: string, width: number, src: string) {
  // 파일명에 ] 나 | 가 있으면 줄이 깨지므로 미리 털어낸다
  const safeAlt = alt.replace(/[[\]|()]/g, "").trim();
  return `![${safeAlt}|${width}](${src})`;
}

export function parseImageLine(line: string): BodyImage | null {
  const m = IMAGE_LINE.exec(line.trim());
  if (!m) return null;
  return { alt: m[1], width: Number(m[2]) || 100, src: m[3] };
}

/** 본문을 문단과 사진으로 쪼갠다 */
export function parseBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ kind: "text", text });
    buffer = [];
  };

  for (const line of body.split("\n")) {
    const image = parseImageLine(line);
    if (image) {
      flush();
      blocks.push({ kind: "image", ...image });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return blocks;
}

/** 본문에 실제로 쓰인 사진 경로들 */
export function imagePathsIn(body: string): string[] {
  return body
    .split("\n")
    .map((line) => parseImageLine(line)?.src)
    .filter((v): v is string => Boolean(v));
}

/** 지금 그 사진에 걸려 있는 너비 */
export function imageWidthOf(body: string, src: string) {
  for (const line of body.split("\n")) {
    const image = parseImageLine(line);
    if (image?.src === src) return image.width;
  }
  return 100;
}

/** 그 사진 줄의 너비만 바꾼다 — 위치와 이름은 그대로 둔다 */
export function resizeImage(body: string, src: string, width: number) {
  return body
    .split("\n")
    .map((line) => {
      const image = parseImageLine(line);
      return image && image.src === src ? imageMarkdown(image.alt, width, image.src) : line;
    })
    .join("\n");
}

/** 그 사진 줄을 통째로 들어낸다 */
export function removeImage(body: string, src: string) {
  return body
    .split("\n")
    .filter((line) => parseImageLine(line)?.src !== src)
    .join("\n");
}
