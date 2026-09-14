"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LoginFilm.module.css";

/** Decorative, silent film. The still is also the slow-network / motion fallback. */
export function LoginFilm({ editing }: { editing: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    let visible = true;

    function syncPlayback() {
      if (!video) return;
      const quiet =
        editing ||
        document.hidden ||
        !visible ||
        motion.matches ||
        connection?.saveData ||
        /(^|-)2g$/.test(connection?.effectiveType ?? "") ||
        userPaused.current;
      if (quiet) video.pause();
      else void video.play().catch(() => { /* Autoplay blocked: keep the still. */ });
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.1 });
    observer.observe(video);
    document.addEventListener("visibilitychange", syncPlayback);
    motion.addEventListener("change", syncPlayback);
    syncPlayback();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, [editing]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      void video.play().catch(() => { /* The poster remains available. */ });
    } else {
      userPaused.current = true;
      video.pause();
    }
  }

  return (
    <div className={styles.film} data-login-film>
      <video
        ref={videoRef}
        className={styles.video}
        src="/media/login-ocean.mp4"
        poster="/media/login-ocean-poster.jpg"
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setFailed(true); setPlaying(false); }}
      />
      <div className={styles.shade} />
      <div className={styles.caption}>
        <h1>반가워요,<br />해랑!</h1>
        <p>우리의 다음 만남을 여기서.</p>
      </div>
      {!failed && (
        <button
          className={styles.control}
          type="button"
          onClick={togglePlayback}
          aria-label={playing ? "배경 영상 일시정지" : "배경 영상 재생"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M7 5h3v14H7zm7 0h3v14h-3z" /> : <path d="m8 5 11 7-11 7z" />}
          </svg>
        </button>
      )}
    </div>
  );
}
