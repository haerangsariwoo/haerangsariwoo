import { getMyStats } from "@/lib/my-stats";
import { CalendarView } from "./CalendarView";

export const metadata = { title: "봉사 캘린더 · 해랑사리우" };

export default async function CalendarPage() {
  const { records } = await getMyStats();
  return <CalendarView records={records} />;
}
