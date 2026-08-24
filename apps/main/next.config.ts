import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 개발 서버는 기본적으로 localhost 가 아닌 곳에서 오는 요청을 막는다.
   * 폰으로 LAN IP(예: http://223.194.130.18:3010)에 접속해 테스트할 때
   * 이 목록에 없는 IP 는 스크립트가 403 으로 막혀 화면은 뜨지만 아무 버튼도
   * 눌리지 않는다 — 폰이 홈으로 안 넘어가던 원인이 이거였다.
   *
   * 와이파이를 바꾸면(핫스팟 등) IP 가 달라지므로 그때마다 여기 추가한다.
   * 프로덕션 빌드에는 영향이 없다.
   */
  allowedDevOrigins: ["223.194.130.18"],
};

export default nextConfig;
