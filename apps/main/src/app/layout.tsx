import type { Metadata, Viewport } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const jua = Jua({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "해랑사리우",
  description: "한성대학교 봉사동아리 해랑사리우 회원 웹앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E7CF6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${jua.variable}`}>
      <body>{children}</body>
    </html>
  );
}
