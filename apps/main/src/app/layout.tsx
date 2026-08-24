import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/**
 * design.md §1.2 — 제목 Montserrat, 본문은 CircularXX 대신 Pretendard.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * 본문 글꼴 (Pretendard 1.3.9). CDN 대신 앱 안에 넣고 직접 낸다.
 * 홈 화면에 추가해 쓰는 앱이라 네트워크가 없거나 CDN 이 막혀도
 * 한글이 그대로 나와야 한다.
 *
 * scripts/build-pretendard.py 로 2,009KB → 1,234KB 로 줄였다.
 * 굵기 축을 앱이 쓰는 400~700 으로 좁히고 한자·가나·키릴을 뺐다.
 * 한글은 완성형 11,172자를 통째로 남겨 어떤 이름도 폴백으로 떨어지지 않는다.
 */
const pretendard = localFont({
  src: "./fonts/pretendard.woff2",
  variable: "--font-pretendard",
  weight: "400 700",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
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
  fallback: ["system-ui", "sans-serif"],
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
    <html lang="ko" className={`${pretendard.variable} ${montserrat.variable} ${inkLipquid.variable}`}>
      <body>{children}</body>
    </html>
  );
}
