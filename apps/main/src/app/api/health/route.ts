import { NextResponse } from "next/server";
import { runtimeRegion } from "@/lib/runtime-region";

export const dynamic = "force-dynamic";

/**
 * 지금 돌고 있는 게 어느 커밋인지 알려주는 자리.
 *
 * "배포했는데 화면이 안 바뀐다" 를 눈으로 확인할 방법이 없어서 그동안
 * 추측으로 좇았다. 배포된 커밋과 실행 리전을 그대로 돌려주면 한 번에
 * 끝난다. 여기 나오는 값은 공개 저장소에 이미 있는 것들이라 가려둘 게 없다.
 */

const VMS_URL = "https://www.vms.or.kr/partspace/recruit.do";

/** 오류의 속을 그대로 펴서 보여준다 — 겉메시지만으로는 원인을 좁힐 수 없다 */
function unwrap(e: unknown, depth = 0): unknown {
  if (depth > 4) return "…";
  if (!(e instanceof Error)) return String(e);

  const x = e as Error & {
    code?: string;
    errno?: number;
    syscall?: string;
    address?: string;
    port?: number;
    cause?: unknown;
    errors?: unknown[];
  };

  return {
    name: x.name,
    message: x.message,
    code: x.code,
    errno: x.errno,
    syscall: x.syscall,
    address: x.address,
    port: x.port,
    errors: Array.isArray(x.errors) ? x.errors.slice(0, 3).map((i) => unwrap(i, depth + 1)) : undefined,
    cause: x.cause == null ? undefined : unwrap(x.cause, depth + 1),
  };
}

/**
 * VMS 에 실제로 한 번 연결해 보고 결과를 그대로 돌려준다.
 * 캐시를 거치면 언제 적 값인지 알 수 없어 원인을 좇을 수가 없었다.
 */
async function probeVms() {
  const started = Date.now();
  try {
    const res = await fetch(VMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (compatible; HaerangsariwooBot/1.0)",
        Referer: VMS_URL,
      },
      body: new URLSearchParams({
        page: "1",
        rcritsttdte: new Date().toISOString().slice(0, 10),
        rcritenddte: "",
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const html = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      bytes: html.length,
      cards: (html.match(/<li class="card">/g) ?? []).length,
      ms: Date.now() - started,
    };
  } catch (e) {
    return { ok: false, ms: Date.now() - started, error: unwrap(e) };
  }
}

export async function GET(request: Request) {
  const base = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
    region: runtimeRegion(),
    buildRegion: process.env.VERCEL_REGION ?? "local",
    now: new Date().toISOString(),
  };

  if (new URL(request.url).searchParams.get("vms") !== "1") {
    return NextResponse.json(base);
  }

  return NextResponse.json({ ...base, vms: await probeVms() });
}
