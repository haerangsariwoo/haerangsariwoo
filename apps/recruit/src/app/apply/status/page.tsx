import { getLandingContent, getRecruitSettings } from "@/lib/content-queries";
import { StatusView } from "./StatusView";

export default async function StatusPage() {
  const [config, content] = await Promise.all([getRecruitSettings(), getLandingContent()]);
  return <StatusView config={config} nextSteps={content.nextSteps} />;
}
