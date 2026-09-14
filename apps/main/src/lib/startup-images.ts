// CSS screen dimensions and device pixel ratio, not device names.
// Existing iPhone sizes also cover models that share the same display.
export const STARTUP_SCREENS = [
  [320, 568, 2],
  [375, 667, 2],
  [414, 736, 3],
  [375, 812, 3],
  [390, 844, 3],
  [393, 852, 3],
  [414, 896, 2],
  [414, 896, 3],
  [428, 926, 3],
  [430, 932, 3],
  [402, 874, 3],
  [440, 956, 3],
  [420, 912, 3],
] as const;

export const APPLE_STARTUP_IMAGES = STARTUP_SCREENS.flatMap(([w, h, ratio]) =>
  (["portrait", "landscape"] as const).flatMap((orientation) =>
    (["light", "dark"] as const).map((theme) => {
      const width = (orientation === "portrait" ? w : h) * ratio;
      const height = (orientation === "portrait" ? h : w) * ratio;
      return {
        url: `/startup/splash-v2-${width}x${height}-${theme}.png`,
        media: `screen and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation}) and (prefers-color-scheme: ${theme})`,
        width,
        height,
        ratio,
        theme,
      };
    }),
  ),
);
