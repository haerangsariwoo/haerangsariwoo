import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 지금 돌고 있는 게 어느 커밋인지 알려주는 자리.
 *
 * "배포했는데 화면이 안 바뀐다" 를 눈으로 확인할 방법이 없어서 그동안
 * 추측으로 좇았다. 배포된 커밋과 실행 리전을 그대로 돌려주면 한 번에
 * 끝난다. 여기 나오는 값은 공개 저장소에 이미 있는 것들이라 가려둘 게 없다.
 */
export function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
    region: process.env.VERCEL_REGION ?? "local",
    now: new Date().toISOString(),
  });
}
