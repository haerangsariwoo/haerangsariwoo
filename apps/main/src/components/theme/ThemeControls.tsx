"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cancelThemeTransition, transitionTheme } from "@/lib/theme-transition";
import styles from "./ThemeControls.module.css";

type Theme = "light" | "dark" | "system";
const KEY = "haerang-theme";
const EVENT = "haerang-theme-change";
let memoryTheme: Theme = "system";

function preference(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    if (value === "dark" || value === "light") return value;
  } catch {
    return memoryTheme;
  }
  return "system";
}
function isDark() {
  const mode = preference();
  return (
    mode === "dark" ||
    (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
  );
}
function applyTheme() {
  cancelThemeTransition();
  const dark = isDark();
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#0d192a" : "#f8fbff");
}
function subscribe(notify: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", notify);
  media.addEventListener("change", notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", notify);
    media.removeEventListener("change", notify);
  };
}
function snapshot() {
  return `${preference()}:${isDark() ? "dark" : "light"}`;
}
function serverSnapshot() {
  return "system:light";
}
function selectTheme(value: Theme) {
  const dark =
    value === "dark" ||
    (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const resolved = dark ? "dark" : "light";
  const commit = () => {
    memoryTheme = value;
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* Keep this session usable. */
    }
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#0d192a" : "#f8fbff");
    window.dispatchEvent(new Event(EVENT));
  };
  if (document.documentElement.dataset.theme === resolved) {
    cancelThemeTransition();
    commit();
  } else {
    transitionTheme(commit);
  }
}

export function ThemeController() {
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    applyTheme();
    media.addEventListener("change", applyTheme);
    window.addEventListener("storage", applyTheme);
    return () => {
      media.removeEventListener("change", applyTheme);
      window.removeEventListener("storage", applyTheme);
    };
  }, []);
  return null;
}

export function ThemePicker() {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot).split(
    ":",
  )[0];
  return (
    <div className={styles.picker} role="group" aria-label="화면 테마">
      {(
        [
          ["light", "라이트"],
          ["dark", "다크"],
          ["system", "기기 설정"],
        ] as const
      ).map(([mode, label]) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => selectTheme(mode)}
          data-tour={mode === "dark" ? "theme-dark" : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    snapshot,
    serverSnapshot,
  ).endsWith(":dark");
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      onClick={() => selectTheme(dark ? "light" : "dark")}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <path d="M20.7 13A9 9 0 0 1 11 3.3 9 9 0 1 0 20.7 13Z" />
        )}
      </svg>
    </button>
  );
}
