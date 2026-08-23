"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import { heroInterval, heroSlides, landing } from "@/lib/recruit-config";
import styles from "./HeroSlider.module.css";

interface HeroSliderProps {
  applicationsOpen: boolean;
  cohort: string;
}

/**
 * design.md §4.1 — 풀블리드 사진 슬라이더 (4장, 자동 전환).
 * 사진은 확대하지 않는다. 넘기기 전용.
 */
export function HeroSlider({ applicationsOpen, cohort }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = heroSlides.length;

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + total) % total),
    [total],
  );

  // 자동 전환 — 마우스가 올라가 있거나 포커스가 안에 있으면 멈춘다.
  // index 를 의존성에 두어, 직접 넘긴 뒤에는 타이머가 처음부터 다시 돈다.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (paused || total < 2) return;
    // 애니메이션을 줄이도록 설정한 사용자에게는 자동 전환을 걸지 않는다
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    timer.current = setTimeout(() => setIndex((i) => (i + 1) % total), heroInterval);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [paused, total, index]);

  const current = heroSlides[index];

  return (
    <section
      className={styles.hero}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="캐러셀"
      aria-label="해랑사리우 소개"
    >
      <div className={styles.slides}>
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            className={cn(styles.slide, i === index && styles.active)}
            aria-hidden={i !== index}
          >
            <Image
              className={styles.slideImage}
              src={s.photoUrl}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              unoptimized
            />
          </div>
        ))}
        <span className={styles.scrim} />
      </div>

      <div className={styles.body}>
        <p className={styles.eyebrow}>{landing.heroLead}</p>

        {/* 슬라이드마다 바뀌는 문구 */}
        <div className={styles.caption} aria-live="polite">
          <h1 key={`t-${current.id}`} className={cn(styles.title, styles.fadeUp)}>
            {current.title}
          </h1>
          <p key={`s-${current.id}`} className={cn(styles.subtitle, styles.fadeUp)}>
            {current.subtitle}
          </p>
        </div>

        <p className={styles.status}>
          <span className={cn(styles.statusDot, !applicationsOpen && styles.off)} />
          {applicationsOpen ? `${cohort} 신입 부원 모집 중` : "다음 모집을 준비하고 있습니다"}
        </p>

        <div className={styles.actions}>
          {applicationsOpen ? (
            <>
              <Link href="/apply">
                <Button size="md" onPhoto>
                  지원하기 →
                </Button>
              </Link>
              <Link href="/apply/status">
                <Button size="md" variant="ghost">
                  결과 확인
                </Button>
              </Link>
            </>
          ) : (
            <a href="#about">
              <Button size="md" variant="ghost">
                동아리 알아보기
              </Button>
            </a>
          )}
        </div>
      </div>

      <button
        type="button"
        className={cn(styles.arrow, styles.prev)}
        onClick={() => go(-1)}
        aria-label="이전 사진"
      >
        ‹
      </button>
      <button
        type="button"
        className={cn(styles.arrow, styles.next)}
        onClick={() => go(1)}
        aria-label="다음 사진"
      >
        ›
      </button>

      <div className={styles.dots}>
        {heroSlides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={styles.dot}
            aria-current={i === index}
            aria-label={`${i + 1}번째 사진 보기`}
            onClick={() => setIndex(i)}
          >
            <span className={styles.dotMark} />
          </button>
        ))}
      </div>
    </section>
  );
}
