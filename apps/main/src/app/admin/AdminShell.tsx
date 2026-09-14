"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo/Logo";
import { AdminNav } from "./AdminNav";
import { AdminTopbar } from "./AdminTopbar";
import styles from "./layout.module.css";

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="m14 6-6 6 6 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
    </svg>
  );
}

export function AdminShell({ name, cohort, role, children }: {
  name: string;
  cohort: string;
  role: string;
  children: ReactNode;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopToggle = useRef<HTMLButtonElement>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const expanded = manualOpen || peeking || focused;

  function closeDesktop() {
    setManualOpen(false);
    setPeeking(false);
    setFocused(false);
    desktopToggle.current?.focus();
  }

  function closeMobile() {
    setMobileOpen(false);
    mobileToggle.current?.focus();
  }

  return (
    <div className={`adminScope ${styles.shell}`}>
      <div className={styles.sidebarSpace} data-expanded={expanded}>
        <aside
          className={styles.sidebar}
          data-expanded={expanded}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) setPeeking(true);
          }}
          onPointerLeave={(event) => {
            setPeeking(false);
            if (event.pointerType === "mouse") setManualOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeDesktop();
          }}
        >
          <button
            ref={desktopToggle}
            type="button"
            className={styles.sidebarToggle}
            aria-label={expanded ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={expanded}
            aria-controls="admin-desktop-menu"
            title={expanded ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => {
              setManualOpen(!expanded);
              setPeeking(false);
              setFocused(false);
              desktopToggle.current?.focus();
            }}
          ><MenuGlyph open={expanded} /></button>
          <span className={styles.railLabel} aria-hidden="true">메뉴</span>
          <div
            id="admin-desktop-menu"
            className={styles.sidebarBody}
            inert={!expanded}
            onFocusCapture={(event) => {
              // Pointer clicks must not latch the hover menu open after navigation.
              setFocused(event.target.matches(":focus-visible"));
            }}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
            }}
          >
            <Link href="/admin" className={styles.brand} aria-label="관리자 홈으로" onClick={closeDesktop}>
              <Logo size={36} className={styles.mascot} priority />
            </Link>
            <AdminNav onNavigate={closeDesktop} />
            <div className={styles.profile}>
              <span className={styles.avatar}>{name.charAt(0)}</span>
              <div>
                <p className={styles.profileName}>{name} {role}</p>
                <p className={styles.profileMeta}>{cohort} / {role}</p>
              </div>
            </div>
            <Link href="/home" className={styles.backToApp} onClick={closeDesktop}>회원 앱으로 돌아가기</Link>
          </div>
        </aside>
      </div>
      <div className={styles.main}>
        <AdminTopbar menuTrigger={
          <button
            ref={mobileToggle}
            type="button"
            className={styles.mobileMenuToggle}
            aria-label={mobileOpen ? "관리자 메뉴 닫기" : "관리자 메뉴 열기"}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          ><MenuGlyph open={mobileOpen} /></button>
        } />
        <div id="admin-mobile-menu" className={styles.mobileNav} hidden={!mobileOpen}
          onKeyDown={(event) => { if (event.key === "Escape") closeMobile(); }}>
          <AdminNav onNavigate={closeMobile} />
          <Link href="/home" onClick={closeMobile}>회원 앱으로 돌아가기</Link>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
