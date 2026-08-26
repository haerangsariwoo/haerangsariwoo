import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toMessage, type InboxMessage, type InboxRow } from "@/lib/inbox-shared";

export const getMyMessages = cache(async (): Promise<InboxMessage[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("inbox_messages")
    .select("id, kind, title, body, href, is_read, sent_at")
    .eq("member_id", user.id)
    .order("sent_at", { ascending: false });

  return ((data ?? []) as InboxRow[]).map(toMessage);
});

export async function getUnreadCount(): Promise<number> {
  const rows = await getMyMessages();
  return rows.filter((m) => !m.read).length;
}
