import { getMyMessages } from "@/lib/inbox";
import { MessageList } from "./MessageList";

export const metadata = { title: "쪽지함 · 해랑사리우" };

export default async function MessagesPage() {
  const messages = await getMyMessages();
  return <MessageList initial={messages} />;
}
