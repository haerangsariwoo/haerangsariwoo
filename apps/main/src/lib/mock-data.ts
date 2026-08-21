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
  externalUrl?: string;
  intro: string;
  duties: string[];
  supplies: string[];
  cautions: string[];
  manager: string;
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

export const volunteers: VolunteerSummary[] = [
  {
    id: "v1",
    title: "한강 플로깅",
    org: "성북구 자원봉사센터",
    dateLabel: "8.29 (토) · 15명 모집",
    timeLabel: "09:00 – 12:00",
    place: "뚝섬한강공원 자벌레 앞",
    creditHours: 3,
    applied: 9,
    capacity: 15,
    category: "환경",
    source: "internal",
    status: "open",
    thumbTone: "mint",
    intro:
      "한강 산책로를 걸으며 쓰레기를 줍는 플로깅 활동입니다. 가볍게 걷고 함께 이야기 나누며 환경도 지키는 봉사예요.",
    duties: ["구역별 쓰레기 수거", "분리배출 정리", "활동 사진 촬영 보조"],
    supplies: ["편한 운동화", "장갑(현장 제공)", "개인 물통"],
    cautions: ["우천 시 일정이 변경될 수 있습니다.", "집합 시간 10분 전까지 도착해 주세요."],
    manager: "김우영 운영진",
  },
  {
    id: "v2",
    title: "무료급식 배식 봉사",
    org: "성북종합사회복지관",
    dateLabel: "9.05 (토) · 20명 모집",
    timeLabel: "10:00 – 14:00",
    place: "성북종합사회복지관 1층 식당",
    creditHours: 4,
    applied: 14,
    capacity: 20,
    category: "복지",
    source: "1365",
    status: "open",
    thumbTone: "peach",
    externalUrl: "https://www.1365.go.kr",
    intro:
      "지역 어르신들께 점심 식사를 준비하고 배식하는 봉사입니다. 1365 자원봉사포털에서 신청하실 수 있습니다.",
    duties: ["식사 준비 보조", "배식 및 정리", "식기 세척 지원"],
    supplies: ["위생모(현장 제공)", "앞치마"],
    cautions: ["1365 포털에서 별도 신청이 필요합니다.", "위생 교육 후 활동이 시작됩니다."],
    manager: "성북종합사회복지관",
  },
  {
    id: "v3",
    title: "아동센터 교육 봉사",
    org: "성북꿈나무센터",
    dateLabel: "8.22 (토) · 16명 모집",
    timeLabel: "13:00 – 16:00",
    place: "성북꿈나무센터 2층 교실",
    creditHours: 3,
    applied: 12,
    capacity: 16,
    category: "교육",
    source: "internal",
    status: "closing",
    thumbTone: "sky",
    intro:
      "초등학생 학습을 도와주는 멘토링 봉사입니다. 숙제 지도와 함께 놀이 활동도 진행합니다.",
    duties: ["1:2 학습 멘토링", "숙제 지도", "놀이 활동 보조"],
    supplies: ["필기구", "실내화"],
    cautions: ["아동 대상 활동으로 사전 교육이 필요합니다."],
    manager: "이서연 운영진",
  },
  {
    id: "v4",
    title: "유기견 보호소 봉사",
    org: "성북 동물보호센터",
    dateLabel: "9.12 (토) · 12명 모집",
    timeLabel: "10:00 – 13:00",
    place: "성북 동물보호센터",
    creditHours: 3,
    applied: 12,
    capacity: 12,
    category: "환경",
    source: "vms",
    status: "closed",
    thumbTone: "lavender",
    externalUrl: "https://www.vms.or.kr",
    intro: "보호소 견사 청소와 산책 봉사를 진행합니다.",
    duties: ["견사 청소", "산책 보조", "사료 급여"],
    supplies: ["장화", "여벌 옷"],
    cautions: ["동물 알레르기가 있는 경우 참여가 어렵습니다."],
    manager: "성북 동물보호센터",
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
  memberCount: 6,
};
