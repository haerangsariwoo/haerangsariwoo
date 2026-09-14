import Image from "next/image";
import styles from "./LoadingState.module.css";

export function LoadingState({ message = "잠시만요, 곧 만나요." }: { message?: string }) {
  return (
    <div role="status" className={styles.loading}>
      <Image src="/brand/dolphin-hello.webp" width={480} height={480} sizes="76px" className={styles.dolphin} alt="" />
      <p>{message}</p>
      <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
    </div>
  );
}
