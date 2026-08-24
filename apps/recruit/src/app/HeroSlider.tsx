"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { heroInterval, heroSlides, landing } from "@/lib/recruit-config";
import styles from "./HeroSlider.module.css";

interface HeroSliderProps {
  applicationsOpen: boolean;
}

/**
 * design.md §4.1 — 풀블리드 사진 슬라이더 (4장, 자동 전환).
 * 사진은 확대하지 않는다. 넘기기 전용.
 */
export function HeroSlider({ applicationsOpen }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const total = heroSlides.length;

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + total) % total),
    [total],
  );

  /**
   * 자동 전환. index 를 의존성에 두어 직접 넘긴 뒤에는 처음부터 다시 센다.
   * 타이머 id 는 이 실행분을 지역 변수로 잡아둔다 — ref 에 담아두면
   * 정리 시점에 다른 실행분의 id 를 지우게 되어 타이머가 쌓인다.
   * 커서를 올려도 멈추지 않는다. 넘기는 방법은 화살표·점·자동 전환 셋뿐이다.
   */
  useEffect(() => {
    if (total < 2) return;
    // 애니메이션을 줄이도록 설정한 사용자에게는 자동 전환을 걸지 않는다
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setTimeout(() => setIndex((i) => (i + 1) % total), heroInterval);
    return () => clearTimeout(id);
  }, [total, index]);

  const current = heroSlides[index];

  return (
    <section
      className={styles.hero}
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

        {/* 버튼 면 대신 텍스트 링크. 사진 위에서는 면이 있는 버튼 두 개보다
            글자만 있는 편이 사진을 덜 가린다. */}
        <div className={styles.actions}>
          {applicationsOpen ? (
            <>
              <Link href="/apply" className={styles.actionPrimary}>
                지원하기 <span aria-hidden="true">→</span>
              </Link>
              <Link href="/apply/status" className={styles.actionSecondary}>
                결과 확인
              </Link>
            </>
          ) : (
            <a href="#about" className={styles.actionSecondary}>
              동아리 알아보기 →
            </a>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={cn(styles.arrow, styles.prev)}
          onClick={() => go(-1)}
          aria-label="이전 사진"
        >
          ‹
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

        <button
          type="button"
          className={cn(styles.arrow, styles.next)}
          onClick={() => go(1)}
          aria-label="다음 사진"
        >
          ›
        </button>
      </div>
    </section>
  );
}
