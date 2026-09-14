import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./theme.css";
import { ThemeController } from "@/components/theme/ThemeControls";
import { AppSplash } from "@/components/onboarding/AppSplash";
import { SPLASH_BOOTSTRAP, SPLASH_CRITICAL_CSS } from "@/lib/app-splash";
import { APPLE_STARTUP_IMAGES } from "@/lib/startup-images";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";

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

export const metadata: Metadata = {
  title: "해랑사리우",
  description: "한성대학교 봉사동아리 해랑사리우 회원 웹앱",
  // Next emits mobile-web-app-capable; retain Apple's legacy launch-image flag too.
  other: { "apple-mobile-web-app-capable": "yes" },
  appleWebApp: {
    capable: true,
    title: "해랑사리우",
    statusBarStyle: "default",
    startupImage: APPLE_STARTUP_IMAGES.map(({ url, media }) => ({
      url,
      media,
    })),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fbff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: SPLASH_CRITICAL_CSS }} />
        <link rel="preload" as="image" href="/brand/dolphin-hello.webp" />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOTSTRAP }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{let t='system';try{t=localStorage.getItem('haerang-theme')||'system'}catch{}const d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'})()`,
          }}
        />
      </head>
      <body>
        <AppSplash />
        <template
          data-design-contract="blue-tide"
          dangerouslySetInnerHTML={{
            __html: `<!-- THESIS: Blue Tide makes a member's next action immediate; no desktop table-of-contents UI.
OWN-WORLD: cobalt blue, light and dark ocean surfaces, Korean type, heart-holding dolphin app mark, tactile icons and a MY wave.
STORY: recognize the club, find the next activity, respond, certify volunteering, and stay connected.
FIRST VIEWPORT: compact brand header without a slogan, live current-weather card with opt-in device location and city lookup, optional real-control guided tour, notice strip, four shortcuts, then next meeting before statistics. Five fixed thumb-zone destinations with a raised circular home at the center.
FORM: content-discovery member app, Operate; user-pinned blue dolphin direction, comp-led; choice 3, seed 6affe4e4.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
          }}
        />
        <Suspense
          fallback={
            <div
              style={{ minHeight: "100dvh", background: "var(--entry-canvas)" }}
            >
              <LoadingState message="화면을 준비하고 있어요." />
            </div>
          }
        >
          {children}
        </Suspense>
        <ThemeController />
      </body>
    </html>
  );
}
