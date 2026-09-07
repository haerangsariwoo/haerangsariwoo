import { NextResponse } from "next/server";
import { runtimeRegion } from "@/lib/runtime-region";

export const dynamic = "force-dynamic";

/**
 * 지금 돌고 있는 게 어느 커밋인지 알려주는 자리.
 *
 * 고친 화면이 관리자 쪽이면 로그인 뒤에 있어서 "배포가 실제로 나갔는지" 를
 * 밖에서 확인할 방법이 없었다. 그래서 화면이 안 바뀐 건지 배포가 안 된 건지
 * 구분을 못 하고 추측으로 좇았다. 배포된 커밋과 실행 지역을 그대로 돌려주면
 * 한 번에 끝난다. 여기 나오는 값은 공개 저장소에 이미 있는 것들이라
 * 가려둘 게 없다 — 지원자 정보는 하나도 지나가지 않는다.
 *
 * 메인 앱(app.haerangsariwoo.site)의 같은 주소와 형태를 맞춘다.
 */
export async function GET() {
  return NextResponse.json({
    app: "recruit",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
    region: runtimeRegion(),
    buildRegion: process.env.VERCEL_REGION ?? "local",
    now: new Date().toISOString(),
  });
}
