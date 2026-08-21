import styles from "./AppHeader.module.css";

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.mascot} role="img" aria-label="해랑사리우 마스코트">
          🐬
        </span>
        <span className={styles.wordmark}>해랑사리우</span>
      </div>
      <button type="button" className={styles.menuButton} aria-label="메뉴 열기">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </header>
  );
}
