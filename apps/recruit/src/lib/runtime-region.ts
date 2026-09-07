/**
 * 지금 이 코드가 실제로 도는 지역.
 *
 * process.env.VERCEL_REGION 처럼 점으로 읽으면 빌드할 때 값이 박혀버려서,
 * 빌드가 돌아간 지역이 런타임 지역인 양 남는다. 실제로 이것 때문에 페이지가
 * 어디서 도는지 잘못 읽었다. 키를 조립해 읽으면 그대로 런타임 값이 온다.
 */
export function runtimeRegion() {
  const key = ["VERCEL", "REGION"].join("_");
  return process.env[key] ?? "local";
}
