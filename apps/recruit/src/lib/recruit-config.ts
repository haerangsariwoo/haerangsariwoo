/**
 * 모집 설정의 타입과 "아직 관리자가 채우지 않았을 때" 쓰는 기본값.
 * 실제 값은 recruit_settings · landing_content · application_fields 에서
 * 읽어온다 (lib/content-queries.ts). 여기 값들은 표가 비어 있어도 랜딩이
 * 멀쩡히 보이도록 남겨 둔 바탕이다.
 */

export type RecruitPhase = "before" | "open" | "closed" | "announced";

export interface RecruitConfig {
  /** 모집 연도 (예: 2026) */
  year: number;
  /** 모집 학기 (1 또는 2) */
  semesterNo: 1 | 2;
  semester: string;
  /** 지원 접수 on/off — 오프시즌에도 랜딩 소개는 계속 공개된다 */
  applicationsOpen: boolean;
  phase: RecruitPhase;
  applyStart: string;
  applyEnd: string;
  firstResultDate: string;
  interviewRange: string;
  finalResultDate: string;
  /**
   * 면접 시간 변경을 막을 시각 (ISO). 비어 있으면 잠그지 않는다.
   * 이 시각이 지나면 이미 고른 사람은 못 바꾸고, 아직 안 고른 사람은
   * 그 뒤에도 고를 수 있다 — 연락이 닿지 않은 사람까지 막을 이유는 없다.
   */
  interviewLockAt: string | null;
}

export const recruitConfig: RecruitConfig = {
  year: 2026,
  semesterNo: 2,
  semester: "2026학년도 2학기",
  applicationsOpen: true,
  phase: "open",
  applyStart: "8.25 (월)",
  applyEnd: "9.05 (금)",
  firstResultDate: "9.08 (월)",
  interviewRange: "9.11 (목) – 9.13 (토)",
  finalResultDate: "9.16 (화)",
  interviewLockAt: null,
};

/** 가입 연도·학기를 "26-2기" 형태로 표기한다 (회원 앱과 동일 규칙) */
export function cohortLabel(year: number, semester: 1 | 2) {
  return `${String(year).slice(2)}-${semester}기`;
}

export const brand = {
  name: "해랑사리우",
  slogan1: "나눔으로 하나되는 우리,",
  slogan2: "봉사로 빛나는 청춘",
  tradition: "1996년부터 이어온 30년 봉사의 전통",
};

/**
 * 고정 비율 박스에 사진을 올릴 때 어느 부분이 보일지 정하는 값.
 * x·y 는 기준점 위치(%), zoom 은 그 지점을 중심으로 한 확대 배율.
 */
export interface PhotoFocus {
  x: number;
  y: number;
  zoom: number;
}

export const defaultPhotoFocus: PhotoFocus = { x: 50, y: 50, zoom: 1 };

/** 랜딩 활동 카드 — 사진은 관리자가 상시 업로드·교체 */
export interface ActivityCard {
  id: string;
  title: string;
  /** 사진 위에 항상 보이는 짧은 이름 (예: "친바") */
  shortLabel: string;
  desc: string;
  photoUrl: string | null;
  focus?: PhotoFocus;
}

export const activityCards: ActivityCard[] = [
  {
    id: "ac2",
    title: "친해지길 바라",
    shortLabel: "친바",
    desc: "매주 이어지는 친목 활동으로 부원들과 유대감을 쌓고, 함께 성장하는 공동체 문화를 만들어갑니다.",
    photoUrl: "/activity/friendship.jpg",
  },
  {
    id: "ac1",
    title: "봉사 활동",
    shortLabel: "봉사",
    desc: "지역사회와 함께하는 정기 봉사로 나눔의 가치를 실천하고, 꾸준한 관계 속에서 실질적인 도움을 전합니다.",
    photoUrl: "/activity/volunteer.jpg",
  },
  {
    id: "ac3",
    title: "MT",
    shortLabel: "MT",
    desc: "학기마다 떠나는 MT 에서 추억을 쌓고 팀워크를 다지며, 봉사에 대한 마음을 함께 나눕니다.",
    photoUrl: "/activity/mt.jpg",
  },
];

/**
 * 히어로 슬라이드 — design.md §4.1 "풀블리드 사진 슬라이더 (4장, 자동 전환)".
 * 사진은 관리자 페이지에서 교체한다.
 */
export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  photoUrl: string;
  focus?: PhotoFocus;
  /**
   * 휴대폰에서만 쓸 사진. 비워두면 위 사진을 그대로 쓴다.
   *
   * PC 는 가로로 넓고 폰은 세로로 길어서, 한 장으로는 어느 한쪽이 잘린다.
   * 가로 사진과 세로 사진을 따로 두면 둘 다 제대로 보인다.
   */
  mobilePhotoUrl?: string;
  mobileFocus?: PhotoFocus;
}

export const heroSlides: HeroSlide[] = [
  {
    id: "hs1",
    title: "해랑사리우",
    subtitle: "나눔으로 하나되는 우리, 봉사로 빛나는 청춘",
    photoUrl: "/landing/hero-1.jpg",
  },
  {
    id: "hs2",
    title: "함께하는 봉사",
    subtitle: "지역사회와 함께 성장하는 중앙 봉사동아리",
    photoUrl: "/landing/hero-2.jpg",
  },
  {
    id: "hs3",
    title: "1996년부터 현재까지",
    subtitle: "30년간 이어온 봉사의 전통",
    photoUrl: "/landing/hero-3.jpg",
  },
  {
    id: "hs4",
    title: "매 학기 새로운 시작",
    subtitle: "신입 부원과 함께 다음 이야기를 씁니다",
    photoUrl: "/landing/hero-4.jpg",
  },
];

/** 슬라이드 자동 전환 간격 (ms) */
export const heroInterval = 5000;

/**
 * 랜딩 문구 — design.md §5 Copy & Tone 을 따른다.
 * 평서형(~합니다) 통일, 이모지·감탄사 없음, 소개는 한 단락.
 * 관리자 페이지에서 편집하게 되면 landing_content 테이블로 옮긴다.
 */
export const landing = {
  heroLead: "한성대학교 중앙 봉사동아리",
  about: {
    title: "About",
    body: "해랑사리우는 1996년 창설된 한성대학교 중앙 봉사동아리로, 대학 생활의 의미를 봉사에서 찾고 지역사회와 함께 성장하려는 학생들이 모인 공동체입니다. 단발적인 참여에 그치지 않는 지속적인 봉사와 기획 활동을 통해 공동체에 실질적인 도움을 전하고, 구성원 각자가 책임감과 연대감을 바탕으로 성장할 수 있는 경험을 만들어갑니다.",
  },
  activities: {
    title: "Activities",
    lead: "해랑사리우는 봉사를 중심으로 다양한 활동을 진행하며, 구성원들과 함께 성장하고 지역사회에 기여합니다.",
  },
  recruiting: {
    title: "Recruiting",
    lead: "매 학기 3월과 9월에 신입 부원을 모집합니다.",
    checklistTitle: "우리는 이런 분들을 찾고 있습니다",
    checklist: [
      "봉사 활동에 관심이 있고 함께 참여할 의사가 있으신 분",
      "지역사회에 도움을 주고 싶은 따뜻한 마음을 가지신 분",
      "부원들과 소통하며 함께 성장하고 싶으신 분",
      "봉사 경험이 없어도 열정을 가지신 분",
    ],
    quote: "봉사를 사랑하시는 여러분, 환영합니다.",
  },
  footer: {
    address: "서울특별시 성북구 삼선교로16길 116 한성대학교",
    instagram: "https://www.instagram.com/haerangsariwoo",
    instagramLabel: "@haerangsariwoo",
  },
} as const;

/**
 * 푸터 제작 크레딧.
 *
 * 관리자 화면에서 고치지 않는다 — 기수마다 바뀌는 값이 아니라서 표에
 * 둘 만큼은 아니다. 다음에 만든 사람이 바뀌면 이 줄만 고치면 된다.
 */
export const credits = {
  createdBy: "김재겸",
  assistedBy: ["김우영", "김동하"],
} as const;

/** 헤더 내비게이션 — 우리 앱 구조에 맞춘 항목 */
export const navItems = [
  { href: "#about", label: "소개" },
  { href: "#activities", label: "활동" },
  { href: "#recruiting", label: "모집 안내" },
  { href: "#faq", label: "Q&A" },
] as const;

export const processSteps = [
  { no: 1, label: "지원" },
  { no: 2, label: "1차 결과" },
  { no: 3, label: "면접 선택" },
  { no: 4, label: "최종 결과" },
];

// §5 Copy & Tone — 평서형(~합니다) 통일, 감탄사·이모지를 쓰지 않는다
export const faqs = [
  {
    q: "봉사 경험이 없어도 되나요?",
    a: "대부분 처음 시작합니다. 신입 부원 교육을 통해 함께 배워나가면 됩니다.",
  },
  {
    q: "결과는 어디서 확인하나요?",
    a: "지원 시 정한 학번과 본인 지정번호로 로그인하면 이곳에서 바로 확인할 수 있습니다.",
  },
  {
    q: "지원 자격이 어떻게 되나요?",
    a: "한성대학교 재학생이면 학부·트랙·학년 관계없이 누구나 지원할 수 있습니다.",
  },
];

/**
 * 지원서 문항 — 관리자가 편집 가능.
 * 학번은 1단계(지원자 확인)에서 이미 받으므로 여기서 다시 묻지 않는다.
 */
export interface FormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "tel" | "number" | "textarea";
  required: boolean;
  help?: string;
  maxLength?: number;
}

export const applicationFields: FormField[] = [
  {
    name: "track",
    label: "소속 (학부/트랙)",
    placeholder: "예: 웹공학트랙",
    type: "text",
    required: true,
  },
  { name: "name", label: "이름", placeholder: "이름을 입력해 주세요", type: "text", required: true },
  {
    name: "phone",
    label: "연락처",
    placeholder: "010-0000-0000",
    type: "tel",
    required: true,
  },
];

export const motivationField: FormField = {
  name: "motivation",
  label: "지원 동기",
  placeholder: "해랑사리우와 함께하고 싶은 이유를 자유롭게 작성해 주세요.",
  type: "textarea",
  required: true,
  maxLength: 1000,
};

/** 면접 슬롯 — 관리자가 날짜·시간대를 열어둔다 */
export interface InterviewSlot {
  id: string;
  date: string;
  time: string;
  taken: number;
  capacity: number;
}

export const interviewSlots: InterviewSlot[] = [
  { id: "s1", date: "9.11 (목)", time: "14:00", taken: 3, capacity: 3 },
  { id: "s2", date: "9.11 (목)", time: "14:30", taken: 2, capacity: 3 },
  { id: "s3", date: "9.11 (목)", time: "15:00", taken: 1, capacity: 3 },
  { id: "s4", date: "9.12 (금)", time: "11:00", taken: 3, capacity: 3 },
  { id: "s5", date: "9.12 (금)", time: "11:30", taken: 0, capacity: 3 },
  { id: "s6", date: "9.12 (금)", time: "13:00", taken: 2, capacity: 3 },
  { id: "s7", date: "9.13 (토)", time: "10:00", taken: 1, capacity: 3 },
  { id: "s8", date: "9.13 (토)", time: "10:30", taken: 2, capacity: 3 },
];

export const interviewPlace = "한성대학교 미래관 · 상세 장소는 예약 후 안내";

export const nextSteps = [
  "운영진 안내 확인",
  "메인 회원 앱 계정 발급",
  "신입 부원 교육 참여",
];

/* ---------- 랜딩 콘텐츠 (landing_content 표 한 줄) ---------- */

export interface AboutFact {
  value: string;
  label: string;
}

export interface LandingPhoto {
  photoUrl: string;
  focus: PhotoFocus;
}

export interface Faq {
  q: string;
  a: string;
}

/**
 * 관리자 [콘텐츠 관리]에서 고치는 랜딩 문구·사진 전부.
 * landing_content 는 한 줄짜리 표라 컬럼 하나가 여기 필드 하나에 대응한다.
 */
export interface LandingContent {
  heroSlides: HeroSlide[];
  aboutBody: string;
  aboutFacts: AboutFact[];
  aboutPhoto: LandingPhoto;
  activitiesLead: string;
  activityCards: ActivityCard[];
  recruitingLead: string;
  checklistTitle: string;
  checklist: string[];
  quote: string;
  faqs: Faq[];
  footerAddress: string;
  footerInstagram: string;
  interviewPlace: string;
  nextSteps: string[];
}

export const defaultAboutPhoto: LandingPhoto = {
  photoUrl: "/landing/about-photo.avif",
  focus: defaultPhotoFocus,
};

export const defaultAboutFacts: AboutFact[] = [
  { value: "1996", label: "한성대학교 중앙 봉사동아리로 창설" },
  { value: "30년", label: "지금까지 이어온 봉사의 전통" },
];

export const defaultLandingContent: LandingContent = {
  heroSlides,
  aboutBody: landing.about.body,
  aboutFacts: defaultAboutFacts,
  aboutPhoto: defaultAboutPhoto,
  activitiesLead: landing.activities.lead,
  activityCards,
  recruitingLead: landing.recruiting.lead,
  checklistTitle: landing.recruiting.checklistTitle,
  checklist: [...landing.recruiting.checklist],
  quote: landing.recruiting.quote,
  faqs,
  footerAddress: landing.footer.address,
  footerInstagram: landing.footer.instagram,
  interviewPlace,
  nextSteps,
};

/** 인스타그램 주소에서 화면에 보여줄 @아이디를 뽑는다 */
export function instagramLabel(url: string) {
  const handle = url.replace(/\/+$/, "").split("/").pop();
  return handle ? `@${handle}` : url;
}
