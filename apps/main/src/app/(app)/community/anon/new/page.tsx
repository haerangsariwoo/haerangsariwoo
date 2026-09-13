import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/get-current-member";
import { AnonComposer } from "../AnonComposer";

/** 익명 글쓰기 — 승인된 부원이면 누구나 쓴다 */
export default async function NewAnonPostPage() {
  const me = await getCurrentMember();
  if (!me) redirect("/");
  return <AnonComposer />;
}
