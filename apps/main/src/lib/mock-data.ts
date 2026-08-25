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

export const volunteerCategories = ["전체", "환경", "교육", "복지"] as const;

export const myTeam = {
  eventLabel: "MT 3조",
  memberCount: 7,
};
