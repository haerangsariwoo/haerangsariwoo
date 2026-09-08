import { notFound, redirect } from "next/navigation";
import { findAlbum } from "@/lib/albums";
import { getCurrentMember } from "@/lib/get-current-member";
import { AlbumComposer } from "../../AlbumComposer";

/**
 * 게시글 고치기.
 *
 * 단추를 감추는 것만으로는 막은 것이 아니다 — 주소를 직접 치면 들어온다.
 * 여기서 한 번 더 본다.
 */
export default async function EditAlbumPage({
  params,
}: PageProps<"/community/album/[id]/edit">) {
  const me = await getCurrentMember();
  if (!me) redirect("/");
  if (me.role === "부원") redirect("/community?tab=앨범");

  const { id } = await params;
  const item = await findAlbum(id);
  if (!item) notFound();

  return (
    <AlbumComposer
      album={{
        id: item.id,
        title: item.title,
        body: item.body,
        ratio: item.ratio,
        // rowId·path 가 없는 사진은 고칠 방법이 없으니 넘긴다
        photos: item.photos.flatMap((p) =>
          p.rowId && p.path
            ? [
                {
                  rowId: p.rowId,
                  path: p.path,
                  thumbPath: p.thumbPath ?? null,
                  // 고르는 동안 보는 그림이라 작은 것으로 충분하다
                  url: p.url,
                  focus: p.focus,
                },
              ]
            : [],
        ),
      }}
    />
  );
}
