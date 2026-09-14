let activeTransition: ViewTransition | null = null;
let generation = 0;

export function cancelThemeTransition() {
  generation++;
  activeTransition?.skipTransition();
  activeTransition = null;
  delete document.documentElement.dataset.themeTransition;
}

/** Animate snapshots, not the live page: fixed navigation and scroll stay put. */
export function transitionTheme(apply: () => void) {
  cancelThemeTransition();
  const current = generation;
  if (
    !document.startViewTransition ||
    document.hidden ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    apply();
    return;
  }

  let applied = false;
  const commit = () => {
    // Skipping an animation does not cancel its pending DOM-update callback.
    if (current !== generation || applied) return;
    applied = true;
    apply();
  };
  const cleanup = () => {
    if (current !== generation) return;
    activeTransition = null;
    delete document.documentElement.dataset.themeTransition;
  };

  document.documentElement.dataset.themeTransition = "active";
  try {
    const transition = document.startViewTransition(commit);
    activeTransition = transition;
    // A rapid second choice can reject `ready`; the latest choice still applies.
    void transition.ready.catch(() => {});
    void transition.finished.then(cleanup, cleanup);
  } catch {
    commit();
    cleanup();
  }
}
