import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ALBUM_BUCKET, tonesFor, type Album, type AlbumPhoto } from "@/lib/community";
import { toAlbumRatio } from "./album-ratio";
import { defaultPhotoFocus, type PhotoFocus } from "@/lib/photo-focus";

/** 서명한 사진 주소가 살아 있는 시간. 프로필 사진과 같게 맞춘다 */
const SIGNED_URL_TTL = 60 * 60;


interface AlbumRow {
  id: string;
  title: string;
  body: string | null;
  ratio: string | null;
  sort_order: number | null;
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
    // 컬럼을 나열하면 아직 만들지 않은 컬럼 하나 때문에 앨범 전체를 못 읽는다
    .select("*, album_photos(id, path, thumb_path, sort_order, focus)")
    // 큰 값이 위로. 운영진이 정한 차례가 없으면 올린 시각 순으로 떨어진다
    .order("sort_order", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as AlbumRow[];

  /*
   * 사진 주소는 서명해서 만든다.
   *
   * 공개 주소를 쓰면 주소를 아는 사람은 로그인 없이도 활동 사진을 볼 수
   * 있다. 부원끼리 보려고 올린 사진이라 그러면 안 된다. 서명한 주소는
   * 한 시간 뒤 만료되고, 화면은 열 때마다 새로 만들어 붙인다.
   */
  const paths = [
    ...new Set(
      rows.flatMap((a) =>
        a.album_photos.flatMap((p) => [p.path, p.thumb_path].filter(Boolean) as string[]),
      ),
    ),
  ];

  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: links } = await supabase.storage
      .from(ALBUM_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const l of links ?? []) {
      if (l.path && l.signedUrl) signed.set(l.path, l.signedUrl);
    }
  }

  return rows.map((a) => {
    const photos: AlbumPhoto[] = [...a.album_photos]
      .sort((x, y) => x.sort_order - y.sort_order)
      .map((p) => {
        const full = signed.get(p.path) ?? "";
        return {
          // 썸네일이 없는 예전 사진은 원본으로 대신한다
          url: signed.get(p.thumb_path ?? p.path) ?? full,
          fullUrl: full,
          // download 를 붙이면 브라우저가 열지 않고 파일로 받는다.
          // 서명한 주소에는 이미 물음표가 있으므로 & 로 잇는다
          downloadUrl: full ? `${full}&download` : "",
          rowId: p.id,
          path: p.path,
          thumbPath: p.thumb_path,
          focus: p.focus ?? defaultPhotoFocus,
        };
      });

    return {
      id: a.id,
      title: a.title,
      body: a.body ?? "",
      ratio: toAlbumRatio(a.ratio),
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
