import type { InterviewSlotOption } from "./InterviewPicker";

/**
 * 지원 현황 화면을 지원자 없이 띄워 보는 자리.
 *
 * 안내 카드뉴스를 만들려면 합격 화면·면접 시간 고르기 같은 화면이 필요한데,
 * 그러자고 실제 결과를 발표하면 그 순간 지원자 전원에게 나간다. 학번도
 * 결과도 지어내서 화면만 보여준다.
 *
 * 개발 서버에서만 켜진다 — process.env.NODE_ENV 는 빌드할 때 값이 박히므로
 * 배포본에서는 아래 코드가 통째로 사라진다.
 */

export const PREVIEW_STAGES = [
  "submitted",
  "firstPass",
  "booked",
  "interviewDone",
  "firstFail",
  "finalPass",
  "finalFail",
] as const;

export type PreviewStage = (typeof PREVIEW_STAGES)[number];

export const PREVIEW_LABEL: Record<PreviewStage, string> = {
  submitted: "제출 완료 (1차 발표 전)",
  firstPass: "1차 합격 · 면접 시간 고르기",
  booked: "면접 시간 예약 완료",
  interviewDone: "면접 완료 · 최종 발표 대기",
  firstFail: "1차 불합격",
  finalPass: "최종 합격",
  finalFail: "최종 불합격",
};

export interface PreviewResult {
  firstResult: "대기" | "합격" | "불합격";
  finalResult: "대기" | "합격" | "불합격";
  interview: string | null;
  firstPublished: boolean;
  finalPublished: boolean;
  interviewLocked: boolean;
}

/** 이미 지나간 날짜라야 "면접 완료" 로 보인다 */
const PAST_INTERVIEW = "1.5 (월) 10:20";
const FUTURE_INTERVIEW = "9.11 (금) 14:00";

const RESULTS: Record<PreviewStage, PreviewResult> = {
  submitted: { firstResult: "대기", finalResult: "대기", interview: null, firstPublished: false, finalPublished: false, interviewLocked: false },
  firstPass: { firstResult: "합격", finalResult: "대기", interview: null, firstPublished: true, finalPublished: false, interviewLocked: false },
  booked: { firstResult: "합격", finalResult: "대기", interview: FUTURE_INTERVIEW, firstPublished: true, finalPublished: false, interviewLocked: false },
  interviewDone: { firstResult: "합격", finalResult: "대기", interview: PAST_INTERVIEW, firstPublished: true, finalPublished: false, interviewLocked: true },
  firstFail: { firstResult: "불합격", finalResult: "대기", interview: null, firstPublished: true, finalPublished: false, interviewLocked: false },
  finalPass: { firstResult: "합격", finalResult: "합격", interview: PAST_INTERVIEW, firstPublished: true, finalPublished: true, interviewLocked: true },
  finalFail: { firstResult: "합격", finalResult: "불합격", interview: PAST_INTERVIEW, firstPublished: true, finalPublished: true, interviewLocked: true },
};

export function previewResult(stage: string | null): PreviewResult | null {
  if (!stage) return null;
  return RESULTS[stage as PreviewStage] ?? null;
}

/** 시간 고르기 화면을 채울 가짜 시간대 — 하루 치를 20분 간격으로 */
export function previewSlots(): InterviewSlotOption[] {
  const days = ["9.10 (목)", "9.11 (금)"];
  const out: InterviewSlotOption[] = [];

  for (const date of days) {
    for (let at = 10 * 60; at + 20 <= 13 * 60; at += 20) {
      const hhmm = (m: number) =>
        `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const time = hhmm(at);
      // 몇 자리는 줄여 두고 하나는 채워 둔다 — 실제 화면이 어떻게 보이는지 알려면 필요하다
      const left = time === "11:00" ? 0 : time === "10:40" ? 1 : 3;
      out.push({
        id: `${date}@${time}`,
        label: `${date} ${time}`,
        date,
        time,
        endTime: hhmm(at + 20),
        left,
        capacity: 3,
      });
    }
  }

  return out;
}
