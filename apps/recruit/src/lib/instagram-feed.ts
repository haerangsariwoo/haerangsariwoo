/**
 * 인스타그램 피드 예시 게시물.
 * 실시간 크롤링은 인스타그램 이용약관상 불가능해 대표 예시로 대체한다.
 * 실제 서비스에서는 Supabase 로 옮긴 뒤 운영진이 직접 올린 게시물을 보여준다.
 */

export interface InstagramPost {
  id: string;
  date: string;
  caption: string;
  images: string[];
}

export const instagramPosts: InstagramPost[] = [
  {
    id: "ig1",
    date: "2026.08.10",
    caption:
      "2학기 첫 정기 봉사로 지역 아동센터를 방문했습니다. 학기 초부터 함께해 준 부원들 덕분에 즐거운 하루를 보냈습니다.",
    images: ["/landing/hero-2.svg", "/landing/hero-3.svg"],
  },
  {
    id: "ig2",
    date: "2026.07.22",
    caption:
      "여름 MT 를 다녀왔습니다. 봉사 이야기부터 서로의 일상까지, 부원들과 가까워질 수 있었던 시간이었습니다.",
    images: ["/activity/mt.svg", "/landing/hero-4.svg"],
  },
  {
    id: "ig3",
    date: "2026.06.15",
    caption:
      "친해지길 바라 활동으로 신입 부원과 기존 부원이 한 팀을 이루어 시간을 보냈습니다. 매주 이어지는 만남으로 유대감이 쌓입니다.",
    images: ["/activity/friendship.svg"],
  },
  {
    id: "ig4",
    date: "2026.05.30",
    caption:
      "지역 복지관과 함께한 정기 봉사입니다. 꾸준한 방문으로 쌓아온 신뢰가 실질적인 도움으로 이어지고 있습니다.",
    images: ["/activity/volunteer.svg", "/landing/about-photo.avif"],
  },
  {
    id: "ig5",
    date: "2026.04.18",
    caption:
      "신입 부원 환영 행사를 진행했습니다. 새로 합류한 부원들과 함께 한 학기 활동을 소개하는 시간을 가졌습니다.",
    images: ["/landing/hero-1.svg"],
  },
];
