import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { tonesFor, type Album, type AlbumPhoto } from "@/lib/community";
import { defaultPhotoFocus, type PhotoFocus } from "@/lib/photo-focus";

export const ALBUM_BUCKET = "album-photos";

interface AlbumRow {
  id: string;
  title: string;
  date_label: string;
  album_photos: {
    id: string;
    path: string;
    thumb_path: string | null;
    sort_order: number;
    focus: PhotoFocus | null;
  }[];
}

export const getAlbums = cache(async (): Promise<Album[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("id, title, date_label, album_photos(id, path, thumb_path, sort_order, focus)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as AlbumRow[]).map((a) => {
    const photos: AlbumPhoto[] = [...a.album_photos]
      .sort((x, y) => x.sort_order - y.sort_order)
      .map((p) => {
        const urlOf = (path: string) =>
          supabase.storage.from(ALBUM_BUCKET).getPublicUrl(path).data.publicUrl;
        const full = urlOf(p.path);
        return {
          // 썸네일이 없는 예전 사진은 원본으로 대신한다
          url: urlOf(p.thumb_path ?? p.path),
          fullUrl: full,
          // ?download 를 붙이면 브라우저가 열지 않고 파일로 받는다
          downloadUrl: `${full}?download`,
          path: p.path,
          focus: p.focus ?? defaultPhotoFocus,
        };
      });

    return {
      id: a.id,
      title: a.title,
      date: a.date_label,
      photoCount: photos.length,
      tones: tonesFor(a.id),
      photos,
    };
  });
});

export async function findAlbum(id: string) {
  const all = await getAlbums();
  return all.find((a) => a.id === id) ?? null;
}
