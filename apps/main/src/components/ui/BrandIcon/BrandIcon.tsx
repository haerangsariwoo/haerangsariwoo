import styles from "./BrandIcon.module.css";
import Image from "next/image";
export type BrandIconName =
  | "home"
  | "calendar"
  | "heart"
  | "chat"
  | "dolphin"
  | "certificate"
  | "camera"
  | "team"
  | "bell";
type IconName = BrandIconName | "wave";
const positions: Record<BrandIconName, [number, number]> = {
  home: [0, 0],
  calendar: [50, 0],
  heart: [100, 0],
  chat: [0, 50],
  dolphin: [50, 50],
  certificate: [100, 50],
  camera: [0, 100],
  team: [50, 100],
  bell: [100, 100],
};
export function BrandIcon({
  name,
  size = 44,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  if (name === "wave")
    return (
      <Image
        src="/brand/wave-icon.webp"
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ flex: "none", objectFit: "contain" }}
      />
    );
  const [x, y] = positions[name];
  return (
    <span
      aria-hidden="true"
      className={`${styles.icon} ${className}`}
      style={{ width: size, height: size, backgroundPosition: `${x}% ${y}%` }}
    />
  );
}
