/**
 * 사진 여러 장을 ZIP 한 덩어리로 묶는다.
 *
 * 압축은 하지 않는다(store). 앨범 사진은 이미 JPEG 라 다시 압축해도 크기가
 * 거의 줄지 않고, 폰에서 돌리기엔 시간과 배터리만 든다. 묶기만 해도
 * "사진 20장을 한 번에 받는다"는 목적은 그대로 달성된다.
 *
 * 압축을 안 하니 형식이 단순해져서 외부 라이브러리 없이 쓸 수 있다.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP 은 1980년 기준의 옛 날짜 형식을 쓴다 */
function dosDateTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** 같은 이름이 있으면 뒤에 (2), (3) 을 붙인다 — 안 그러면 푸는 쪽에서 덮어쓴다 */
export function uniqueNames(names: string[]) {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const used = seen.get(name);
    if (used === undefined) {
      seen.set(name, 1);
      return name;
    }
    const next = used + 1;
    seen.set(name, next);
    const dot = name.lastIndexOf(".");
    return dot <= 0
      ? `${name} (${next})`
      : `${name.slice(0, dot)} (${next})${name.slice(dot)}`;
  });
}

export function makeZip(entries: ZipEntry[], now = new Date()): Blob {
  const { time, date } = dosDateTime(now);
  const encoder = new TextEncoder();

  const parts: BlobPart[] = [];
  const central: ArrayBuffer[] = [];
  let centralSize = 0;
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // 로컬 헤더 표식
    local.setUint16(4, 20, true); // 풀려면 필요한 버전
    local.setUint16(6, 0x0800, true); // 파일 이름이 UTF-8 임을 알린다 (한글 이름)
    local.setUint16(8, 0, true); // 압축 방식: 없음
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, entry.data.length, true);
    local.setUint32(22, entry.data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true); // 여분 필드 없음

    parts.push(local.buffer, name, entry.data as unknown as BlobPart);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true); // 중앙 목록 표식
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint16(10, 0, true);
    dir.setUint16(12, time, true);
    dir.setUint16(14, date, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, entry.data.length, true);
    dir.setUint32(24, entry.data.length, true);
    dir.setUint16(28, name.length, true);
    dir.setUint32(42, offset, true); // 이 파일의 로컬 헤더 위치
    const dirBytes = new Uint8Array(46 + name.length);
    dirBytes.set(new Uint8Array(dir.buffer), 0);
    dirBytes.set(name, 46);
    central.push(dirBytes.buffer);
    centralSize += dirBytes.length;

    offset += 30 + name.length + entry.data.length;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); // 꼬리표
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true); // 중앙 목록이 시작하는 위치

  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}
