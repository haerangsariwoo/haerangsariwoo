"use client";

import { createClient } from "@/lib/supabase/client";
import { compressImage, ALBUM_PRESET } from "@/lib/image-compress";

const BUCKET = "landing-photos";

/**
 * Supabase Storage 의 객체 키는 ASCII 만 받는다 — 한글 파일명을 그대로
 * 쓰면 InvalidKey 로 막힌다. 랜딩 사진은 이름을 다시 보여줄 일이 없으니
 * 확장자만 살리고 나머지는 버린다.
 */
function safePath(fileName: string) {
  const ext = /\.([A-Za-z0-9]{1,5})$/.exec(fileName)?.[1]?.toLowerCase() ?? "jpg";
  return `${crypto.randomUUID()}.${ext}`;
}

/** 사진을 공개 버킷에 올리고 랜딩에서 바로 쓸 수 있는 주소를 돌려준다 */
export async function uploadLandingPhoto(original: File): Promise<string | null> {
  const supabase = createClient();
  // 랜딩 사진은 방문자가 가장 먼저 보는 큰 사진이라 앨범과 같은 설정을 쓴다
  let file: File;
  try {
    file = await compressImage(original, ALBUM_PRESET);
  } catch {
    return null;
  }
  const path = safePath(file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** landing_content 는 한 줄짜리 표라 패널마다 자기 컬럼만 갱신한다 */
export async function saveLanding(patch: Record<string, unknown>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("landing_content").update(patch).eq("id", 1);
  return !error;
}
