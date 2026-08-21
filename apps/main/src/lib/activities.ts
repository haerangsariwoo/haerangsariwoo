export type ActivityType = "개강파티" | "MT" | "친목" | "총회" | "회의";
export type AttendState = "참석" | "미정" | "불참";
export type ActivityStatus = "upcoming" | "today" | "closed" | "done";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  dateLabel: string;
  timeLabel: string;
  place: string;
  target: string;
  dday: number | null;
  status: ActivityStatus;
  attend: AttendState | null;
  tone: "sky" | "mint" | "peach" | "lavender";
  intro: string;
  notes: string[];
  teamPublished?: boolean;
}

export const activityTypes = ["전체", "개강파티", "MT", "친목", "총회"] as const;

export const activities: Activity[] = [
  {
    id: "a1",
    type: "총회",
    title: "2학기 정기총회",
    dateLabel: "8.22 (금)",
    timeLabel: "18:30 – 20:30",
    place: "한성대 미래관 401호",
    target: "전 부원",
    dday: 1,
    status: "upcoming",
    attend: "참석",
    tone: "sky",
    intro: "2학기 활동 계획과 예산을 공유하고, 하반기 봉사 일정을 함께 정합니다.",
    notes: ["전 부원 필참입니다.", "불참 시 사전에 운영진에게 알려주세요."],
  },
  {
    id: "a2",
    type: "MT",
    title: "제26회 해랑사리우 MT",
    dateLabel: "9.19 (금) – 9.21 (일)",
    timeLabel: "1박 2일",
    place: "가평 청평유원지",
    target: "전 부원 (신청자)",
    dday: 29,
    status: "upcoming",
    attend: "미정",
    tone: "mint",
    intro: "2학기 첫 MT입니다. 조별 레크리에이션과 바비큐가 준비되어 있어요.",
    notes: ["회비 45,000원 (버스·숙소·식사 포함)", "조 편성은 운영진이 진행합니다."],
    teamPublished: true,
  },
  {
    id: "a3",
    type: "개강파티",
    title: "2학기 개강파티",
    dateLabel: "9.05 (금)",
    timeLabel: "19:00 – 22:00",
    place: "성북구 삼선교 일대",
    target: "전 부원",
    dday: 15,
    status: "upcoming",
    attend: null,
    tone: "peach",
    intro: "신입 부원과 기존 부원이 함께하는 개강 환영 자리입니다.",
    notes: ["회비 20,000원", "참석 여부를 9.01까지 알려주세요."],
  },
  {
    id: "a4",
    type: "친목",
    title: "친해지길 바라 3차",
    dateLabel: "8.08 (금)",
    timeLabel: "18:00 – 21:00",
    place: "성북구 보드게임 카페",
    target: "희망 부원",
    dday: null,
    status: "done",
    attend: "참석",
    tone: "lavender",
    intro: "기수 상관없이 친해지는 소규모 친목 모임입니다.",
    notes: ["활동 사진은 앨범에서 확인할 수 있습니다."],
  },
];

export function findActivity(id: string) {
  return activities.find((a) => a.id === id);
}
