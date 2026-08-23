import Image from "next/image";

interface MascotProps {
  /** 한 변의 길이(px) */
  size: number;
  className?: string;
  priority?: boolean;
}

/**
 * 돌고래 심볼 (정사각). 인사말 옆처럼 마스코트로 쓰는 자리에만 쓴다.
 * 이름이 함께 들어간 가로형 워드마크는 Logo 를 쓴다.
 */
export function Mascot({ size, className, priority }: MascotProps) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
