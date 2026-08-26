import { createAdminClient } from "@/lib/supabase/admin";
import {
  decideBlock,
  gatesFor,
  nextCounts,
  type AttemptRow,
  type ThrottleGate,
} from "./apply-throttle-rules";

/**
 * 본인 지정번호를 찍어 맞히려는 시도를 막는다.
 *
 * 지원자는 로그인 계정이 없어서 학번 + 6자리 번호만으로 본인을 확인한다.
 * 횟수 제한이 없으면 번호를 계속 넣어보며 남의 합격 여부를 들여다볼 수 있다.
 *
 * 서버가 여러 대로 나뉘어 돌기 때문에 세는 자리는 표여야 한다 — 메모리에
 * 세면 요청이 다른 서버로 가는 순간 초기화된다.
 *
 * 세는 데 실패하면 통과시킨다. 표가 아직 없거나 잠깐 말썽일 때 지원 자체가
 * 막히는 편이 훨씬 나쁘다.
 */

export { blockedMessage } from "./apply-throttle-rules";
export type { ThrottleGate };

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

async function readRows(keys: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("apply_attempts")
    .select("key, fails, first_at")
    .in("key", keys);
  if (error) throw error;
  return { supabase, rows: (data ?? []) as AttemptRow[] };
}

/** 지금 막혀 있는지 본다. 막혀 있으면 몇 분 뒤에 풀리는지도 알려준다 */
export async function checkAttempts(request: Request, studentId: string): Promise<ThrottleGate> {
  const gates = gatesFor(clientAddress(request), studentId);

  try {
    const { rows } = await readRows(gates.map((g) => g.key));
    return decideBlock(rows, gates, Date.now());
  } catch {
    return { blocked: false, retryAfterMinutes: 0 };
  }
}

/** 번호가 틀렸을 때 한 번 올린다 */
export async function recordFailure(request: Request, studentId: string) {
  const gates = gatesFor(clientAddress(request), studentId);
  const now = Date.now();

  try {
    const { supabase, rows } = await readRows(gates.map((g) => g.key));
    await supabase.from("apply_attempts").upsert(nextCounts(rows, gates, now));

    // 하루 지난 기록은 쌓아둘 이유가 없다
    await supabase
      .from("apply_attempts")
      .delete()
      .lt("updated_at", new Date(now - 24 * 60 * 60 * 1000).toISOString());
  } catch {
    // 세지 못해도 응답은 정상으로 돌려준다
  }
}

/** 번호가 맞았으면 그동안의 실패를 지운다 */
export async function clearFailures(request: Request, studentId: string) {
  const gates = gatesFor(clientAddress(request), studentId);

  try {
    const supabase = createAdminClient();
    await supabase
      .from("apply_attempts")
      .delete()
      .in(
        "key",
        gates.map((g) => g.key),
      );
  } catch {
    // 지우지 못해도 30분 뒤에는 어차피 풀린다
  }
}
