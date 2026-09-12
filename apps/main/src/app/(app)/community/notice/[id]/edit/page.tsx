import { notFound, redirect } from "next/navigation";
import { findNotice } from "@/lib/notices";
import { getCurrentMember } from "@/lib/get-current-member";
import { NoticeComposer } from "../../NoticeComposer";

/**
 * 공지 고치기. 쓰기와 같은 이유로 여기서도 권한을 다시 본다.
 */
export default async function EditNoticePage({
  params,
}: PageProps<"/community/notice/[id]/edit">) {
  const me = await getCurrentMember();
  if (!me) redirect("/");
  if (me.role === "부원") redirect("/community");

  const { id } = await params;
  const item = await findNotice(id);
  if (!item) notFound();

  return (
    <NoticeComposer
      notice={{
        id: item.id,
        category: item.category,
        title: item.title,
        body: item.body,
        pinned: item.pinned,
      }}
    />
  );
}
