// Presentation only: never navigates, authenticates, caches pages or reads member data.
export const SPLASH_MIN_VISIBLE_MS = 1200;
export const SPLASH_FADE_MS = 220;
export const SPLASH_MAX_MS = 6000;
export const SPLASH_KEY = "haerang-splash-v2";

export const SPLASH_BOOTSTRAP = `(()=>{try{const r=document.documentElement;const replay=new URLSearchParams(location.search).get('splash')==='1';let seen=false;try{seen=!!sessionStorage.getItem('${SPLASH_KEY}')}catch{}const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;const nav=performance.getEntriesByType('navigation')[0];const cold=standalone&&nav?.type==='navigate'&&!document.referrer;if(!location.pathname.startsWith('/admin')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&(replay||!seen||cold)){r.dataset.appSplash='show';if(document.visibilityState!=='hidden')r.dataset.appSplashVisible='true'}}catch{}})()`;

// Inline in <head>: a coloured, sized shell is available before CSS/React/data.
// The independent CSS watchdog also releases the page if hydration fails.
export const SPLASH_CRITICAL_CSS = `
html{background:#f8fbff}html[data-theme="dark"]{background:#102033}
body{margin:0;background:inherit}
[data-app-splash-screen]{display:none;position:fixed;inset:0;z-index:2000;pointer-events:none;background:var(--entry-canvas,#f8fbff);color:var(--ink-900,#0b2053)}
html[data-theme="dark"] [data-app-splash-screen]{background:var(--entry-canvas,#102033);color:var(--ink-900,#eff5ff)}
html[data-app-splash] [data-app-splash-screen]{display:grid;place-items:center;animation:app-splash-safety 7s step-end forwards}
html[data-app-splash="ready"] [data-app-splash-screen],html[data-app-splash="leaving"] [data-app-splash-screen]{animation:app-splash-ready-safety 2s step-end forwards}
html[data-app-splash]:not([data-app-splash-visible]) [data-app-splash-screen]{animation-play-state:paused}
html[data-app-splash="leaving"] [data-app-splash-screen]{opacity:0;transition:opacity ${SPLASH_FADE_MS}ms ease-out}
@keyframes app-splash-safety{to{visibility:hidden}}
@keyframes app-splash-ready-safety{to{visibility:hidden}}
@media(prefers-reduced-motion:reduce){html[data-app-splash] [data-app-splash-screen]{display:none;animation:none;transition:none}}
`;

/** Start the hold after the image has loaded and had two visible paint frames.
 * Automatic focus (e.g. first-use dialog) must NOT dismiss the launch screen.
 */
export function mountSplash() {
  const root = document.documentElement;
  if (root.dataset.appSplash !== "show") return;
  const image = document.querySelector<HTMLImageElement>(
    "[data-app-splash-image]",
  );
  const screen = document.querySelector<HTMLElement>(
    "[data-app-splash-screen]",
  );
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let imageReady = !image;
  let started = false;
  let disposed = false;
  let frame1 = 0;
  let frame2 = 0;
  let hold = 0;
  let fade = 0;
  let watchdog = 0;
  let imageTimeout = 0;

  function cancelTimers() {
    [hold, fade, watchdog, imageTimeout].forEach((timer) =>
      window.clearTimeout(timer),
    );
    cancelAnimationFrame(frame1);
    cancelAnimationFrame(frame2);
  }
  function dismiss() {
    cancelTimers();
    delete root.dataset.appSplash;
    delete root.dataset.appSplashVisible;
    try {
      sessionStorage.setItem(SPLASH_KEY, "seen");
    } catch {
      /* optional */
    }
  }
  function begin() {
    if (
      disposed ||
      started ||
      !imageReady ||
      document.visibilityState === "hidden" ||
      !root.dataset.appSplash
    )
      return;
    // If JS arrived after the CSS escape hatch, do not flash over an already visible app.
    if (screen && window.getComputedStyle(screen).visibility === "hidden") {
      dismiss();
      return;
    }
    started = true;
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        if (disposed || !root.dataset.appSplash) return;
        root.dataset.appSplash = "ready";
        hold = window.setTimeout(() => {
          root.dataset.appSplash = "leaving";
          fade = window.setTimeout(dismiss, SPLASH_FADE_MS);
        }, SPLASH_MIN_VISIBLE_MS);
      });
    });
  }
  function onImageReady() {
    imageReady = true;
    begin();
  }
  function onImageLoad() {
    if (image?.decode) void image.decode().then(onImageReady, onImageReady);
    else onImageReady();
  }
  function onVisibility() {
    if (!root.dataset.appSplash) return;
    if (root.dataset.appSplash === "leaving") {
      dismiss();
      return;
    }
    cancelTimers();
    started = false;
    if (document.visibilityState === "hidden") {
      delete root.dataset.appSplashVisible;
      return;
    }
    root.dataset.appSplashVisible = "true";
    if (root.dataset.appSplash === "ready") root.dataset.appSplash = "show";
    // A failed/slow image still gets a readable wordmark, never an endless overlay.
    watchdog = window.setTimeout(dismiss, SPLASH_MAX_MS);
    imageTimeout = window.setTimeout(onImageReady, 1800);
    begin();
  }
  function onMotion() {
    if (motion.matches) dismiss();
  }
  function onPageShow(event: PageTransitionEvent) {
    if (event.persisted) dismiss();
  }
  image?.addEventListener("load", onImageLoad);
  image?.addEventListener("error", onImageReady);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("pointerdown", dismiss, {
    once: true,
    capture: true,
  });
  document.addEventListener("keydown", dismiss, { once: true, capture: true });
  window.addEventListener("pagehide", dismiss);
  window.addEventListener("pageshow", onPageShow);
  motion.addEventListener("change", onMotion);
  onVisibility();
  if (image?.complete) onImageLoad();
  onMotion();

  return () => {
    disposed = true;
    cancelTimers();
    image?.removeEventListener("load", onImageLoad);
    image?.removeEventListener("error", onImageReady);
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("pointerdown", dismiss, true);
    document.removeEventListener("keydown", dismiss, true);
    window.removeEventListener("pagehide", dismiss);
    window.removeEventListener("pageshow", onPageShow);
    motion.removeEventListener("change", onMotion);
  };
}
