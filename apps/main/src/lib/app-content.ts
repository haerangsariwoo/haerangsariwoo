/**
 * 앱 노출 문구 — 운영진이 관리자 > 콘텐츠 관리에서 수정한다.
 * Supabase 연동 시 app_content 테이블에서 읽어온다.
 */

export const homeCopy = {
  greetingSuffix: "님!",
  subGreeting: "오늘도 따뜻한 하루 보내세요.",
};

export interface AppFaq {
  id: string;
  q: string;
  a: string;
}

/** 부원용 자주 묻는 질문 — 마이페이지·쪽지함에서 노출 */
export const memberFaqs: AppFaq[] = [
  {
    id: "f1",
    q: "봉사시간은 언제 반영되나요?",
    a: "봉사 인증을 제출하면 운영진이 증빙을 검토한 뒤 실적을 업로드합니다. 승인되면 마이페이지에 자동으로 반영돼요.",
  },
  {
    id: "f2",
    q: "신청한 봉사를 취소할 수 있나요?",
    a: "활동 3일 전까지는 앱에서 직접 취소할 수 있습니다. 이후에는 운영진에게 문의해 주세요.",
  },
  {
    id: "f3",
    q: "1365에 올라온 봉사는 어떻게 신청하나요?",
    a: "1365·VMS 배지가 붙은 봉사는 원본 사이트에서 신청해야 합니다. 상세 화면의 버튼을 누르면 해당 사이트로 이동해요.",
  },
  {
    id: "f4",
    q: "조는 언제 확인할 수 있나요?",
    a: "운영진이 조 편성을 발행하면 홈 화면의 '내 조'에서 확인할 수 있습니다. 편성 전에는 표시되지 않아요.",
  },
];

/** 각 화면 하단 안내 문구 */
export interface NoticeCopy {
  id: string;
  screen: string;
  text: string;
}

export const noticeCopies: NoticeCopy[] = [
  {
    id: "nc1",
    screen: "활동",
    text: "동아리 행사 일정입니다. 봉사 신청은 봉사 모집 탭에서 확인해 주세요.",
  },
  {
    id: "nc2",
    screen: "봉사 모집",
    text: "1365 · VMS 배지가 붙은 봉사는 원본 사이트에서 신청해야 합니다.",
  },
  {
    id: "nc3",
    screen: "커뮤니티",
    text: "공지와 활동 앨범만 제공합니다. 운영진 문의는 쪽지함의 익명 문의를 이용해 주세요.",
  },
  {
    id: "nc4",
    screen: "마이",
    text: "봉사시간은 운영진이 승인·업로드한 실적만 반영됩니다.",
  },
  {
    id: "nc5",
    screen: "내 조",
    text: "조 편성은 운영진이 진행하며, 부원은 발행된 결과만 확인할 수 있습니다.",
  },
];
