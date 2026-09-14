"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import styles from "./AppTour.module.css";

const STATUS_KEY = "haerang-tour-v2";
const STEP_KEY = "haerang-tour-v2-step";
const STEPS = [
  {
    path: "/home",
    target: "nav-activities",
    title: "함께할 활동을 찾아볼까요?",
    copy: "아래 ‘활동’을 직접 눌러보세요. 다가오는 활동과 참석 여부를 여기서 확인해요.",
  },
  {
    path: "/activities",
    target: "activity-calendar",
    title: "일정은 달력으로 한눈에",
    copy: "활동 날짜는 이 화면의 달력에서 확인해요. ‘봉사 일정도 보기’를 누르면 봉사와 내 신청 일정도 함께 볼 수 있어요.",
  },
  {
    path: "/calendar",
    target: "nav-community",
    title: "우리의 소식도 만나봐요",
    copy: "아래 ‘커뮤니티’를 눌러 공지와 사진을 보러 가볼까요?",
  },
  {
    path: "/community",
    target: "community-album",
    title: "함께한 순간은 앨범에",
    copy: "‘앨범’ 탭을 눌러보세요. 사진이 올라오면 이곳에서 모아 볼 수 있어요.",
  },
  {
    path: "/community",
    target: "nav-my",
    title: "내 기록과 설정은 MY",
    copy: "파도 아이콘의 ‘MY’를 눌러 나만의 공간으로 이동해보세요.",
  },
  {
    path: "/my",
    target: "theme-dark",
    title: "눈이 편한 다크 모드",
    copy: "화면 설정에서 ‘다크’를 눌러보세요. 라이트나 기기 설정으로 언제든 바꿀 수 있어요.",
  },
  {
    path: "/my",
    target: "nav-home",
    title: "가운데 홈으로 돌아와요",
    copy: "가운데 큰 홈 버튼을 누르면 끝! 앞으로도 이 버튼으로 첫 화면에 돌아올 수 있어요.",
  },
] as const;
type Rect = { x: number; y: number; width: number; height: number };
type TourContext = {
  start: () => void;
  dismiss: () => void;
  welcome: boolean;
  finished: boolean;
  active: boolean;
  ready: boolean;
};
const Context = createContext<TourContext | null>(null);

function persistStatus(value: string) {
  try {
    localStorage.setItem(STATUS_KEY, value);
  } catch {
    /* Optional. */
  }
}
function persistStep(value: number | null) {
  try {
    if (value === null) sessionStorage.removeItem(STEP_KEY);
    else sessionStorage.setItem(STEP_KEY, String(value));
  } catch {
    /* Optional. */
  }
}
export function useAppTour() {
  const value = useContext(Context);
  if (!value) throw new Error("AppTourProvider is required");
  return value;
}

export function AppTourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [index, setIndex] = useState<number | null>(null);
  const [welcome, setWelcome] = useState(false);
  const [finished, setFinished] = useState(false);
  const [ready, setReady] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 390, height: 844 });
  const [panelHeight, setPanelHeight] = useState(205);
  const panel = useRef<HTMLDivElement>(null);
  const advancing = useRef(false);
  const step = index === null ? null : STEPS[index];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = sessionStorage.getItem(STEP_KEY);
        const n = stored === null ? -1 : Number(stored);
        if (Number.isInteger(n) && n >= 0 && n < STEPS.length) setIndex(n);
        else setWelcome(!localStorage.getItem(STATUS_KEY));
      } catch {
        setWelcome(true);
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function start() {
    setWelcome(false);
    setFinished(false);
    setRect(null);
    setIndex(0);
    persistStatus("started");
    persistStep(0);
    if (pathname !== "/home") router.push("/home");
  }
  function dismiss() {
    setWelcome(false);
    setFinished(false);
    setIndex(null);
    setRect(null);
    persistStatus(finished ? "completed" : "skipped");
    persistStep(null);
    document.querySelector<HTMLElement>('[data-tour="menu"]')?.focus();
  }

  useEffect(() => {
    if (index === null || !step) return;
    advancing.current = false;
    let frame = 0;
    let target: HTMLElement | null = null;
    let previousDescription: string | null = null;
    const resize = new ResizeObserver(schedule);
    function measure() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      if (panel.current)
        setPanelHeight(panel.current.getBoundingClientRect().height);
      const next =
        pathname === step!.path
          ? document.querySelector<HTMLElement>(`[data-tour="${step!.target}"]`)
          : null;
      if (!next) {
        setRect(null);
        return;
      }
      if (target !== next) {
        target = next;
        previousDescription = next.getAttribute("aria-describedby");
        next.setAttribute("aria-describedby", "tour-copy");
        resize.observe(next);
        const box = next.getBoundingClientRect();
        if (
          !next.closest('nav[aria-label="주요 메뉴"]') &&
          (box.top < 90 || box.bottom > innerHeight - 210)
        )
          next.scrollIntoView({ block: "center", behavior: "instant" });
        next.focus({ preventScroll: true });
      }
      const box = next.getBoundingClientRect();
      if (!box.width || !box.height) {
        setRect(null);
        return;
      }
      const value = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
      setRect((old) =>
        old &&
        Object.keys(value).every(
          (k) => old[k as keyof Rect] === value[k as keyof Rect],
        )
          ? old
          : value,
      );
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    function activate(event: MouseEvent) {
      if (
        advancing.current ||
        pathname !== step!.path ||
        !(event.target instanceof Element) ||
        !event.target.closest(`[data-tour="${step!.target}"]`)
      )
        return;
      advancing.current = true;
      if (index === STEPS.length - 1) {
        setIndex(null);
        setRect(null);
        setFinished(true);
        persistStatus("completed");
        persistStep(null);
      } else {
        setIndex(index! + 1);
        setRect(null);
        persistStep(index! + 1);
      }
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIndex(null);
        setRect(null);
        persistStatus("skipped");
        persistStep(null);
        document.querySelector<HTMLElement>('[data-tour="menu"]')?.focus();
      }
    }
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    if (panel.current) resize.observe(panel.current);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    document.addEventListener("click", activate, true);
    document.addEventListener("keydown", key);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      document.removeEventListener("click", activate, true);
      document.removeEventListener("keydown", key);
      if (target) {
        if (previousDescription === null)
          target.removeAttribute("aria-describedby");
        else target.setAttribute("aria-describedby", previousDescription);
      }
    };
  }, [index, step, pathname]);

  const width = Math.min(360, viewport.width - 32);
  const left = (viewport.width - width) / 2;
  const below = rect ? rect.y + rect.height + 14 : 90;
  const top = rect
    ? Math.max(
        12,
        Math.min(
          viewport.height - panelHeight - 12,
          below + panelHeight < viewport.height - 100
            ? below
            : rect.y - panelHeight - 16,
        ),
      )
    : 90;

  return (
    <Context.Provider
      value={{ start, dismiss, welcome, finished, active: index !== null, ready }}
    >
      {children}
      {step && index !== null && (
        <div className={styles.layer}>
          {rect && (
            <div
              className={styles.spotlight}
              style={{
                left: rect.x - 5,
                top: rect.y - 5,
                width: rect.width + 10,
                height: rect.height + 10,
              }}
            />
          )}
          <div
            ref={panel}
            className={styles.panel}
            style={{ left, top, width }}
            role="dialog"
            aria-modal="false"
            aria-labelledby="tour-title"
            aria-describedby="tour-copy"
          >
            <div className={styles.meta}>
              <span>
                {index + 1} / {STEPS.length}
              </span>
              <button type="button" onClick={dismiss}>
                그만 보기
              </button>
            </div>
            <h2 id="tour-title">{step.title}</h2>
            <p id="tour-copy">{step.copy}</p>
            {!rect && (
              <button
                type="button"
                className={styles.recover}
                onClick={() => router.push(step.path as Route)}
              >
                가이드 화면으로 이동
              </button>
            )}
            <div className={styles.bottom}>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  const n = index - 1;
                  if (n < 0) return;
                  setRect(null);
                  setIndex(n);
                  persistStep(n);
                  router.push(STEPS[n].path as Route);
                }}
              >
                이전
              </button>
              <span role="status">
                {rect
                  ? "빛나는 버튼을 직접 눌러보세요"
                  : "화면을 준비하고 있어요"}
              </span>
            </div>
          </div>
        </div>
      )}
    </Context.Provider>
  );
}

export function TourRestart() {
  const { start } = useAppTour();
  return (
    <button type="button" className={styles.restart} onClick={start}>
      앱 사용 가이드 다시 보기 <span aria-hidden="true">→</span>
    </button>
  );
}
