import Image from "next/image";

interface LogoProps {
  /** 화면에 보이는 한 변의 길이(px) */
  size: number;
  className?: string;
  priority?: boolean;
}

/** 해랑사리우 돌고래 로고 (투명 배경) */
export function Logo({ size, className, priority }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="해랑사리우"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
