import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Sheet.module.css";

/**
 * 화면을 묶음 단위로 보여주는 틀.
 *
 * 묶음 안은 여백 없이 실선 한 줄로만 나누고, 묶음끼리만 여백으로 띄운다.
 * 경계를 두 종류로 나눠 무엇이 한 덩어리인지 보이게 한다.
 *
 * 좌우는 화면 끝까지 붙는다. data-full-bleed 를 보고
 * (app)/layout.module.css 가 자기 좌우 여백을 걷는다.
 */
export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page} data-full-bleed>
      {children}
    </div>
  );
}

/**
 * 묶음 하나. 직계 자식 하나가 블록 하나가 되어 여백과 아래 실선을 받는다.
 * 여백을 직접 잡아야 하는 블록은 --block-pad-x / --block-pad-y 를 덮어쓴다.
 * 모서리는 첫 묶음·마지막 묶음을 보고 알아서 깎이므로 따로 알릴 것이 없다.
 */
export function SheetGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.group, className)}>{children}</div>;
}
