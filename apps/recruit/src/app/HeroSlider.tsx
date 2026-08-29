"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { defaultPhotoFocus, heroInterval, landing, type HeroSlide } from "@/lib/recruit-config";
import styles from "./HeroSlider.module.css";

interface HeroSliderProps {
  applicationsOpen: boolean;
  slides: HeroSlide[];
}

/**
 * design.md §4.1 — 풀블리드 사진 슬라이더 (4장, 자동 전환).
 * 사진은 확대하지 않는다. 넘기기 전용.
 */
export function HeroSlider({ applicationsOpen, slides: heroSlides }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const total = heroSlides.length;
  const heroRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  /**
   * 모바일 주소창이 스크롤 중 접히고 펴지면서 svh 값 자체가 흔들리는
   * 브라우저가 있다 (특히 iOS Safari). 매 프레임 다시 재는 CSS 단위
   * 대신, 처음 한 번만 실제 높이를 재서 --hero-vh 로 고정해 둔다.
   * 이후엔 스크롤이 아무리 요동쳐도 이 값은 안 바뀐다.
   *
   * resize 는 듣지 않는다 — 그 이벤트 자체가 주소창 접힘/펴짐에도
   * 걸려서, 들으면 지금 없애려는 흔들림이 그대로 재현된다.
   * 실제 회전(가로/세로 전환)만 orientationchange 로 다시 잰다.
   */
  useEffect(() => {
    const setHeroVh = () => {
      document.documentElement.style.setProperty("--hero-vh", `${window.innerHeight}px`);
    };
    setHeroVh();
    // 회전 직후엔 아직 이전 치수일 수 있어 한 프레임 늦춰 다시 잰다
    const onRotate = () => requestAnimationFrame(setHeroVh);
    window.addEventListener("orientationchange", onRotate);
    return () => window.removeEventListener("orientationchange", onRotate);
  }, []);

  /**
   * 화살표를 "사진 세로 가운데" 에 두되, 캡션(부제·제목·버튼) 과는
   * 겹치면 안 된다. 캡션은 화면이 좁을수록, 제목이 길수록 사진 아래
   * 절반 넘게 차지할 수 있어 고정 비율로는 못 피한다 — 실제 렌더된
   * 높이를 재서, 캡션 위에 남는 영역 안에서만 가운데로 둔다.
   * 슬라이드가 바뀌어 제목 길이가 달라져도 ResizeObserver 가 다시 잰다.
   */
  useEffect(() => {
    const hero = heroRef.current;
    const body = bodyRef.current;
    if (!hero || !body) return;

    const setCaptionH = () => {
      hero.style.setProperty("--caption-h", `${body.getBoundingClientRect().height}px`);
    };
    setCaptionH();

    const ro = new ResizeObserver(setCaptionH);
    ro.observe(body);
    return () => ro.disconnect();
  }, []);

  const current = heroSlides[index];

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      aria-roledescription="캐러셀"
      aria-label="해랑사리우 소개"
    >
      <div className={styles.slides}>
        {heroSlides.map((s, i) => {
          const focus = s.focus ?? defaultPhotoFocus;
          // 휴대폰용 사진을 안 올렸으면 PC 사진을 그대로 쓴다
          const mobileUrl = s.mobilePhotoUrl || s.photoUrl;
          const mobileFocus = s.mobilePhotoUrl ? (s.mobileFocus ?? defaultPhotoFocus) : focus;

          return (
            <div
              key={s.id}
              className={cn(styles.slide, i === index && styles.active)}
              aria-hidden={i !== index}
            >
              {/*
                picture 를 쓰면 브라우저가 화면에 맞는 한 장만 내려받는다.
                두 장을 겹쳐 놓고 CSS 로 감추면 안 보이는 것까지 받아 간다.

                자르는 위치는 기기마다 달라야 하는데 인라인 스타일로는 화면
                크기에 따라 바꿀 수 없다. 그래서 값만 변수로 넘기고, 어느
                값을 쓸지는 CSS 가 정한다.
              */}
              <picture>
                <source media="(max-width: 767px)" srcSet={mobileUrl} />
                <img
                  className={styles.slideImage}
                  src={s.photoUrl}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  style={
                    {
                      "--focus-x": `${focus.x}%`,
                      "--focus-y": `${focus.y}%`,
                      "--focus-zoom": focus.zoom,
                      "--m-focus-x": `${mobileFocus.x}%`,
                      "--m-focus-y": `${mobileFocus.y}%`,
                      "--m-focus-zoom": mobileFocus.zoom,
                    } as React.CSSProperties
                  }
                />
              </picture>
            </div>
          );
        })}
        <span className={styles.scrim} />
      </div>

      <div ref={bodyRef} className={styles.body}>
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

        {/* 테두리 상자 + 아래쪽 강조선. 꽉 채운 버튼 두 개보다 사진을
            덜 가리면서도, 밑줄 텍스트보다는 눌러야 할 자리라는 게 분명하다. */}
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
