import Image from "next/image";
import styles from "./ClubLogo.module.css";

/** Original club artwork, in its supplied light and dark versions. */
export function ClubLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={`${styles.logo} ${className}`} role="img" aria-label="해랑사리우">
      <Image className={styles.light} src="/brand/club-logo-light.webp" width={480} height={204} sizes="160px" alt="" priority={priority} />
      <Image className={styles.dark} src="/brand/club-logo-dark.webp" width={480} height={202} sizes="160px" alt="" priority={priority} />
    </span>
  );
}
