import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ProofSubmission } from "@/lib/verify";

export const getMyProofSubmissions = cache(async (): Promise<ProofSubmission[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("proof_submissions")
    .select("*")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as ProofSubmission[];
});

/** 승인된 증빙 시간의 합 — "누적 봉사시간" */
export async function getMyApprovedHours(): Promise<number> {
  const rows = await getMyProofSubmissions();
  return rows.filter((r) => r.status === "승인").reduce((sum, r) => sum + r.hours, 0);
}
