"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import type { CurrentMember } from "@/lib/get-current-member";
import { Logo } from "@/components/ui/Logo/Logo";
import {
  BrandIcon,
  type BrandIconName,
} from "@/components/ui/BrandIcon/BrandIcon";
import styles from "./AppHeader.module.css";
import { ThemePicker } from "@/components/theme/ThemeControls";
import { useAppTour } from "@/components/onboarding/AppTour";
const MENU: { label: string; href: string; icon: BrandIconName }[] = [
  { label: "캘린더", href: "/calendar", icon: "calendar" },
  { label: "봉사 인증", href: "/verify", icon: "certificate" },
  { label: "활동 기록", href: "/my/records", icon: "heart" },
  { label: "내 조", href: "/my/team", icon: "team" },
  { label: "쪽지함", href: "/messages", icon: "chat" },
  { label: "우리 앨범", href: "/community?tab=앨범", icon: "camera" },
];
export function AppHeader({ profile }: { profile: CurrentMember }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { start } = useAppTour();
  const isAdmin = profile.role === "운영진" || profile.role === "관리자";
  const local = profile.id === "local-admin";
  async function logout() {
    if (local) {
      setOpen(false);
      router.push("/login");
      return;
    }
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header className={styles.header}>
        <Link href="/home" aria-label="해랑사리우 홈" className={styles.brand}>
          <Logo size={36} priority />
        </Link>
        <div className={styles.actions}>
          <Link
            href="/messages"
            className={styles.iconButton}
            aria-label="쪽지함"
          >
            <BrandIcon name="bell" size={27} />
          </Link>
          <Dialog.Trigger
            className={styles.iconButton}
            aria-label="전체 메뉴 열기"
            data-tour="menu"
          >
            <span className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </Dialog.Trigger>
        </div>
      </header>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.drawer}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <div className={styles.handle} aria-hidden="true" />
          <div className={styles.drawerHead}>
            <Dialog.Title>어디로 가볼까요?</Dialog.Title>
            <Dialog.Close className={styles.closeButton} aria-label="메뉴 닫기">
              ×
            </Dialog.Close>
          </div>
          <Dialog.Description className={styles.description}>
            해랑의 모든 활동을 한 곳에서.
          </Dialog.Description>
          <Link href="/my" className={styles.profileRow}>
            <BrandIcon name="wave" size={52} />
            <span>
              <strong>{profile.name}</strong>
              <small>
                {profile.cohort}  / {profile.role}
              </small>
            </span>
            <span className={styles.chev}>›</span>
          </Link>
          <nav className={styles.menuGrid} aria-label="바로가기">
            {MENU.map((m) => (
              <Link href={m.href} key={m.href}>
                <BrandIcon name={m.icon} size={48} />
                <span>{m.label}</span>
              </Link>
            ))}
          </nav>
          {isAdmin && (
            <Link className={styles.adminLink} href="/admin">
              <span>
                <strong>운영진 공간</strong>
                <small>회원 / 활동 / 승인 관리</small>
              </span>
              <span>↗</span>
            </Link>
          )}
          <section className={styles.preferences} aria-label="화면과 사용 안내">
            <h3>화면 설정</h3>
            <ThemePicker />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                start();
              }}
            >
              앱 사용 가이드 다시 보기 <span aria-hidden="true">→</span>
            </button>
          </section>
          <div className={styles.footer}>
            <Link href="/my/account">계정 설정</Link>
            <button type="button" onClick={logout}>
              {local ? "로그인 화면 보기" : "로그아웃"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
