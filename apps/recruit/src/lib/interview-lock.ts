/**
 * 면접 시간 변경을 막는 시각을 다룬다.
 *
 * 면접이 끝났는지를 저장된 라벨에서 읽어 판단하려 했지만, 그 날짜는
 * 운영진이 자유롭게 적는 값이라 못 읽는 경우가 생긴다. 운영진이 시각
 * 하나를 정하는 편이 확실하고 예외도 없다.
 */

/** 지금 잠겼는가. 시각이 없으면 잠그지 않는다 */
export function isInterviewLocked(lockAt: string | null | undefined, now = new Date()) {
  if (!lockAt) return false;
  const at = new Date(lockAt);
  return !Number.isNaN(at.getTime()) && at.getTime() <= now.getTime();
}

/*
 * 표기와 입력 변환은 schedule 에 있는 것을 그대로 쓴다.
 * 같은 규칙을 두 곳에 두면 한쪽만 고쳐져 어긋난다 — 실제로 여기 있던
 * 것들이 서버 시각(UTC)으로 찍혀 아홉 시간 밀린 날짜를 보여줬다.
 */
export { formatDayTime as formatLock, fromLocalInput, toLocalInput } from "./schedule";
