import { getActivities } from "@/lib/activity-queries";
import { ActivityList } from "./ActivityList";

export const metadata = { title: "활동 · 해랑사리우" };

export default async function ActivitiesPage() {
  const activities = await getActivities();
  return <ActivityList activities={activities} />;
}
