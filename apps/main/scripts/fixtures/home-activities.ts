import type { Activity } from "../../src/lib/activities";
import type { Album } from "../../src/lib/community";

export const today = "2026-09-14";
const base: Activity = {
  id: "fixture-opening",
  type: "개파",
  title: "개강파티",
  dateLabel: "9.18 (금)",
  dateShort: "9.18",
  weekday: "금",
  timeLabel: "18:00",
  place: "동아리 모임 공간",
  target: "전체 부원",
  dday: 4,
  status: "upcoming",
  attend: "참석",
  tone: "sky",
  intro: "",
  notes: [],
};
export const fixtureActivities: Activity[] = [
  {
    ...base,
    id: "fixture-mt",
    title: "가을 MT, 함께 만드는 우리 동아리의 첫 번째 추억",
    type: "MT",
    dateShort: "10.09",
    dateLabel: "10.09 (금) ~ 10.10 (토)",
    dday: 25,
    attend: null,
    place: "함께하는 공간 3층 / 자세한 집결 장소는 공지에서 확인해주세요",
  },
  base,
  {
    ...base,
    id: "fixture-friends",
    title: "새로운 친구들과 친해지길 바라",
    type: "친바",
    timeLabel: "14:00",
    attend: "미정",
    teamPublished: true,
  },
  {
    ...base,
    id: "fixture-closed",
    title: "신청이 마감된 모임",
    dateShort: "9.20",
    dateLabel: "9.20 (일)",
    weekday: "일",
    status: "closed",
    attend: "불참",
    dday: 6,
  },
  {
    ...base,
    id: "fixture-past",
    title: "지난 학기 종강파티",
    dateShort: "6.20",
    dateLabel: "6.20 (토)",
    weekday: "토",
    type: "종파",
    status: "done",
    dday: null,
  },
];

const album = (id: string, title: string, url?: string, zoom = 1): Album => ({
  id,
  title,
  body: "검증용 예시",
  ratio: "1:1",
  date: "2026.09.14",
  photoCount: url ? 1 : 0,
  tones: [],
  photos: url
    ? [
        {
          url,
          fullUrl: url,
          downloadUrl: url,
          rowId: id,
          path: url,
          thumbPath: null,
          focus: { x: 40, y: 60, zoom },
        },
      ]
    : [],
});
export const fixtureAlbums = [
  album("fixture-a", "우리의 첫 만남", "/brand/coast-cover.webp"),
  album("fixture-b", "확대한 사진도 영역 안에", "/brand/coast-cover.webp", 2.4),
  album("fixture-c", "사진 없는 앨범"),
  album(
    "fixture-d",
    "긴앨범제목도썸네일너비를넘어가지않도록확인하는예시",
    "/brand/app-icon-v2.webp",
  ),
  album("fixture-e", "다섯 번째 앨범은 생략", "/brand/coast-cover.webp"),
];
