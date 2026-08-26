import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { getCurrentMember } from "@/lib/get-current-member";
import { getMyTeam } from "@/lib/teams";
import styles from "./team.module.css";

export const metadata = { title: "내 조 · 해랑사리우" };

export default async function TeamPage() {
  const [team, me] = await Promise.all([getMyTeam(), getCurrentMember()]);

  if (!team) {
    return (
      <div className={styles.page}>
        <PageHeader title="" back={{ href: "/home", label: "홈" }} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>아직 조가 없어요</h2>
          <p className={styles.emptyText}>
            조 편성이 공개되면 여기에서 우리 조와 조원을 확인할 수 있어요.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/home", label: "홈" }} />

      <section className={styles.hero}>
        <p className={styles.eventLabel}>{team.eventTitle}</p>
        <p className={styles.teamName}>{team.teamName}</p>
        <p className={styles.heroMeta}>
          {team.dateLabel}
          <br />
          {team.place}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>조원 {team.members.length}명</h2>
        <ul className={styles.memberList}>
          {team.members.map((m) => (
            <li key={m.name} className={styles.member}>
              <span className={styles.memberAvatar}>{m.name.charAt(0)}</span>
              <span className={styles.memberName}>{m.name}</span>
              {m.isLeader && <span className={styles.leaderTag}>조장</span>}
              {m.name === me?.name && <span className={styles.meTag}>나</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
