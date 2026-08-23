import "server-only";

/**
 * 공공데이터포털은 인증키를 두 가지로 보여준다.
 *   - Decoding: `abc+def/ghi=`
 *   - Encoding: `abc%2Bdef%2Fghi%3D`  (Decoding 을 URL 인코딩한 값)
 *
 * URLSearchParams 가 다시 인코딩하므로 Encoding 키를 그대로 쓰면
 * `%2B` → `%252B` 로 이중 인코딩되어 인증에 실패한다.
 * 어느 쪽을 넣어도 동작하도록 Encoding 형태면 한 번 디코딩해서 돌려준다.
 */
export function normalizeServiceKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = raw.trim();
  if (!key) return undefined;

  // %2B, %3D 처럼 URL 인코딩된 흔적이 있으면 디코딩한다
  if (/%[0-9A-Fa-f]{2}/.test(key)) {
    try {
      return decodeURIComponent(key);
    } catch {
      // 디코딩에 실패하면 원본을 그대로 쓴다
      return key;
    }
  }

  return key;
}
