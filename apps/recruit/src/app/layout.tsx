import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

/**
 * design.md §1.2 — 원본은 Montserrat(제목) + CircularXX(본문).
 * CircularXX 는 상용 폰트라 한글 본문은 Pretendard 로 대체한다.
 * Pretendard 는 Google Fonts 에 없어 공식 CDN 을 쓴다.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "해랑사리우 신입 부원 모집",
  description:
    "1996년부터 이어온 30년 봉사의 전통. 한성대학교 봉사동아리 해랑사리우 신입 부원을 모집합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#176ff2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={montserrat.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
