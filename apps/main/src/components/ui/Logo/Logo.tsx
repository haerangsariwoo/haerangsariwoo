import Image from "next/image";
import { cn } from "@/lib/cn";
import styles from "./Logo.module.css";

interface LogoProps {
  /** 화면에 보이는 높이(px). 가로는 비율에 맞춰 정해진다 */
  size: number;
  className?: string;
  priority?: boolean;
}

/** 해랑사리우 로고 (투명 배경, 가로형) */
export function Logo({ size, className, priority }: LogoProps) {
  return (
    <span className={cn(styles.wrap, className)} style={{ height: size }}>
      <Image
        className={styles.image}
        src="/logo2.avif"
        alt="해랑사리우"
        width={640}
        height={640}
        priority={priority}
        unoptimized
      />
    </span>
  );
}
