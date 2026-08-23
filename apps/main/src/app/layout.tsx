import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/**
 * design.md §1.2 — 제목 Montserrat, 본문은 CircularXX 대신 Pretendard.
 * Pretendard 는 Google Fonts 에 없어 공식 CDN 을 쓴다.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * 손글씨 느낌의 포인트 글꼴 (THEFACESHOP INKLIPQUID).
 * 글리프 전체(18,374자)를 담는다. 서브셋으로 줄이면 용량은 작지만
 * 서브셋에 없는 이름·문구가 폴백으로 떨어져 화면마다 글꼴이 달라진다.
 * 원본 TTF 2.1MB → woff2 306KB.
 *
 * 제목과 인사말에만 쓰고 본문에는 쓰지 않는다.
 */
const inkLipquid = localFont({
  src: "./fonts/inklipquid-full.woff2",
  variable: "--font-accent",
  display: "swap",
  fallback: ["Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "해랑사리우",
  description: "한성대학교 봉사동아리 해랑사리우 회원 웹앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#176ff2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${montserrat.variable} ${inkLipquid.variable}`}>
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
