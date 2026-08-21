export type VolunteerSource = "internal" | "1365" | "vms";

export interface VolunteerSummary {
  id: string;
  title: string;
  dateLabel: string;
  capacityLabel: string;
  category: string;
  source: VolunteerSource;
  thumbTone: "mint" | "peach" | "sky" | "lavender";
  externalUrl?: string;
}

export interface Notice {
  id: string;
  tag: string;
  tagTone: "urgent" | "default";
  title: string;
}

export const member = {
  name: "홍근",
  totalHours: 76,
  totalActivities: 12,
};

export const semesterStatus = {
  attendanceRate: 92,
  hoursDone: 18,
  hoursGoal: 20,
  joinCount: 6,
};

export const nextActivity = {
  org: "아동센터",
  title: "교육 봉사",
  dateLabel: "8.22 (토) · 13:00",
  place: "성북꿈나무센터",
  capacityLabel: "12 / 16명 참여 확정",
  dday: 4,
};

export const recruitingVolunteers: VolunteerSummary[] = [
  {
    id: "v1",
    title: "한강 플로깅",
    dateLabel: "8.29 (토) · 15명 모집",
    capacityLabel: "15명 모집",
    category: "환경",
    source: "internal",
    thumbTone: "mint",
  },
  {
    id: "v2",
    title: "무료급식 배식 봉사",
    dateLabel: "9.05 (토) · 20명 모집",
    capacityLabel: "20명 모집",
    category: "복지",
    source: "1365",
    thumbTone: "peach",
    externalUrl: "https://www.1365.go.kr",
  },
];

export const notices: Notice[] = [
  { id: "n1", tag: "필독", tagTone: "urgent", title: "2학기 정기총회 안내" },
  { id: "n2", tag: "일정", tagTone: "default", title: "신입 부원 교육 일정" },
  { id: "n3", tag: "후기", tagTone: "default", title: "여름봉사 활동 후기" },
  { id: "n4", tag: "MT", tagTone: "default", title: "26회 MT 준비 안내" },
];

export const albumTones = ["sky", "mint", "peach", "lavender"] as const;

export const myTeam = {
  eventLabel: "MT 3조",
  memberCount: 6,
};
