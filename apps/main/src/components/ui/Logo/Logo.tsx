import Image from "next/image";
import { cn } from "@/lib/cn";
import styles from "./Logo.module.css";
interface LogoProps {
  size: number;
  className?: string;
  priority?: boolean;
}
export function Logo({ size, className, priority }: LogoProps) {
  return (
    <span className={cn(styles.wrap, className)} style={{ height: size }}>
      <Image
        className={styles.image}
        src="/brand/app-icon-v2.webp"
        alt=""
        width={size}
        height={size}
        priority={priority}
      />
      <span className={styles.wordmark}>
        해랑사리우
      </span>
    </span>
  );
}
