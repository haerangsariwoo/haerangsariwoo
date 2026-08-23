export type VolunteerSource = "internal" | "1365" | "vms";
export type VolunteerStatus = "open" | "closing" | "waitlist" | "closed";
export type ThumbTone = "mint" | "peach" | "sky" | "lavender";

export interface VolunteerSummary {
  id: string;
  title: string;
  org: string;
  dateLabel: string;
  timeLabel: string;
  place: string;
  creditHours: number;
  applied: number;
  capacity: number;
  category: string;
  source: VolunteerSource;
  status: VolunteerStatus;
  thumbTone: ThumbTone;
  /** 봉사 등록 시 올린 대표 이미지. 없으면 동아리 로고를 기본으로 쓴다 */
  imageUrl?: string;
  externalUrl?: string;
  intro: string;
  duties: string[];
  supplies: string[];
  cautions: string[];
  manager: string;
}

export const member = {
  name: "재겸",
  totalHours: 71,
  totalActivities: 13,
};

export const semesterStatus = {
  attendanceRate: 87,
  hoursDone: 17,
  hoursGoal: 20,
  joinCount: 7,
};

export const nextActivity = {
  org: "아동센터",
  title: "교육 봉사",
  dateLabel: "8.22 (토) · 13:00",
  place: "성북꿈나무센터",
  capacityLabel: "13 / 16명 참여 확정",
  dday: 4,
};

export const volunteers: VolunteerSummary[] = [
  {
    id: "v1",
    title: "성북천 플로깅",
    org: "해랑사리우",
    dateLabel: "8.29 (토) · 15명 모집",
    timeLabel: "09:00 – 12:00",
    place: "성북천 분수마루 앞 집결",
    creditHours: 3,
    applied: 11,
    capacity: 15,
    category: "환경",
    source: "internal",
    status: "open",
    thumbTone: "mint",
    intro:
      "성북천 산책로를 걸으며 쓰레기를 줍는 플로깅 활동입니다. 가볍게 걷고 이야기 나누며 동네도 깨끗하게 만들어요.",
    duties: ["구간별 쓰레기 수거", "분리배출 정리", "활동 사진 촬영 보조"],
    supplies: ["편한 운동화", "장갑(현장 제공)", "개인 물통"],
    cautions: ["우천 시 일정이 변경될 수 있습니다.", "집합 시간 10분 전까지 도착해 주세요."],
    manager: "김우영 운영진",
  },
  {
    id: "v2",
    title: "교내 쓰레기줍기",
    org: "해랑사리우",
    dateLabel: "9.03 (수) · 20명 모집",
    timeLabel: "16:00 – 18:00",
    place: "한성대학교 상상관 앞",
    creditHours: 2,
    applied: 17,
    capacity: 20,
    category: "환경",
    source: "internal",
    status: "closing",
    thumbTone: "sky",
    intro:
      "수업이 끝난 뒤 교내 곳곳을 돌며 쓰레기를 줍습니다. 짧게 참여할 수 있어 첫 봉사로도 좋아요.",
    duties: ["구역별 쓰레기 수거", "분리수거함 정리"],
    supplies: ["편한 복장", "집게·봉투(현장 제공)"],
    cautions: ["활동 후 상상관 앞에서 간단히 마무리 인사를 합니다."],
    manager: "이서연 운영진",
  },
];

export const volunteerCategories = ["전체", "환경", "교육", "복지"] as const;

export function findVolunteer(id: string) {
  return volunteers.find((v) => v.id === id);
}

export const recruitingVolunteers = volunteers.slice(0, 2);

export const albumTones = ["sky", "mint", "peach", "lavender"] as const;

export const myTeam = {
  eventLabel: "MT 3조",
  memberCount: 7,
};
