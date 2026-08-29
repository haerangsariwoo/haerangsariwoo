import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publishState, type PublishState } from "@/lib/schedule";

/**
 * 지금 발표된 상태인지 서버에서 판단한다.
 *
 * 운영진이 손으로 발표했거나, 예약 시각이 왔고 심사가 다 끝났으면 공개다.
 * 심사가 안 끝났으면 시각이 와도 열지 않는다 — 결과가 "대기" 인 채로
 * 공개하면 지원자는 자기가 떨어진 줄 안다.
 *
 * 결과 조회와 면접 시간이 각자 판단하면 언젠가 어긋나므로 한 곳에 둔다.
 */

export interface PublishSettings {
  first_published: boolean | null;
  final_published: boolean | null;
  first_result_at: string | null;
  final_result_at: string | null;
}

export interface PublishFlags {
  first: PublishState;
  final: PublishState;
}

export async function readPublishFlags(
  supabase: SupabaseClient,
  settings: PublishSettings | null,
): Promise<PublishFlags> {
  // 아직 결과를 안 정한 사람이 몇인지만 세면 된다 — 명단을 다 읽을 이유가 없다
  const [firstPending, finalPending] = await Promise.all([
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("first_result", "대기"),
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("first_result", "합격")
      .eq("final_result", "대기"),
  ]);

  return {
    first: publishState({
      published: settings?.first_published ?? false,
      at: settings?.first_result_at ?? null,
      pending: firstPending.count ?? 0,
    }),
    final: publishState({
      published: settings?.final_published ?? false,
      at: settings?.final_result_at ?? null,
      pending: finalPending.count ?? 0,
    }),
  };
}
