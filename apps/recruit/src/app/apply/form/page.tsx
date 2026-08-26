import { getApplicationFields } from "@/lib/content-queries";
import { ApplyForm } from "./ApplyForm";

export default async function ApplicationFormPage() {
  const fields = await getApplicationFields();
  return <ApplyForm fields={fields} />;
}
