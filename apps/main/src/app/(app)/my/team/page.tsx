import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { myTeamDetail, profile } from "@/lib/my";
import styles from "./team.module.css";

export const metadata = { title: "내 조 · 해랑사리우" };

export default function TeamPage() {
  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/home", label: "홈" }} />

      <section className={styles.hero}>
        <p className={styles.eventLabel}>{myTeamDetail.eventTitle}</p>
        <p className={styles.teamName}>{myTeamDetail.teamName}</p>
        <p className={styles.heroMeta}>
          {myTeamDetail.dateLabel}
          <br />
          {myTeamDetail.place}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>조원 {myTeamDetail.members.length}명</h2>
        <ul className={styles.memberList}>
          {myTeamDetail.members.map((m) => (
            <li key={m} className={styles.member}>
              <span className={styles.memberAvatar}>{m.charAt(0)}</span>
              <span className={styles.memberName}>{m}</span>
              {m === myTeamDetail.leader && <span className={styles.leaderTag}>조장</span>}
              {m === profile.name && <span className={styles.meTag}>나</span>}
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
