/**
 * Supabase Storage 의 객체 키는 ASCII 만 받는다 — 한글 파일명을 그대로 쓰면
 * InvalidKey 로 업로드가 막힌다. 그렇다고 이름을 버리면 받는 쪽에서 무슨
 * 파일인지 알 수 없으니, 원래 이름을 base64url 로 실어 보내고 보여줄 때 되돌린다.
 * base64url 문자(A–Z a–z 0–9 - _)는 Storage 키에서 안전하다.
 */

const SEP = "__";

function encodeName(name: string) {
  const bytes = new TextEncoder().encode(name);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeName(encoded: string) {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** 업로드용 경로 — 폴더는 소유자 id 라 스토리지 정책이 그대로 먹는다 */
export function storagePath(ownerId: string, fileName: string) {
  return `${ownerId}/${crypto.randomUUID()}${SEP}${encodeName(fileName)}`;
}

/** 저장 경로에서 사람이 읽을 원래 파일 이름을 되돌린다 */
export function displayFileName(path: string) {
  const base = path.split("/").pop() ?? path;
  const at = base.indexOf(SEP);
  if (at < 0) return base;
  try {
    return decodeName(base.slice(at + SEP.length));
  } catch {
    return base;
  }
}
