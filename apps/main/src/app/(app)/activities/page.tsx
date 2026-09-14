import { getActivities } from "@/lib/activity-queries";
import { ActivityList } from "./ActivityList";

export const metadata = { title: "활동 / 해랑사리우" };

export default async function ActivitiesPage() {
  const activities = await getActivities();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
  return <ActivityList activities={activities} today={today} />;
}
