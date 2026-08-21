import { noticeCopies } from "./app-content";

/** 화면 이름으로 안내 문구를 가져온다 (관리자 > 콘텐츠 관리에서 수정) */
export function noticeFor(screen: string) {
  return noticeCopies.find((n) => n.screen === screen)?.text ?? "";
}
