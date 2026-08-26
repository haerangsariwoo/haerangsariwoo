import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { getActivity } from "@/lib/activity-queries";
import { getMyTeam } from "@/lib/teams";
import { AttendPicker } from "./AttendPicker";
import styles from "./detail.module.css";

export default async function ActivityDetailPage({ params }: PageProps<"/activities/[id]">) {
  const { id } = await params;
  const item = await getActivity(id);
  if (!item) notFound();

  const isPast = item.status === "done";
  const myTeam = item.teamPublished ? await getMyTeam() : null;
  const showTeam = myTeam?.activityId === item.id ? myTeam : null;

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/activities", label: "활동" }} />

      <div className={cn(styles.hero, styles[item.tone])}>
        <span className={styles.typeTag}>{item.type}</span>
      </div>

      <h1 className={styles.title}>{item.title}</h1>

      <section className={styles.factCard}>
        <div className={styles.factRow}>
          <span className={styles.factLabel}>일시</span>
          <span className={styles.factValue}>
            {item.dateLabel}
            {item.timeLabel && ` · ${item.timeLabel}`}
          </span>
        </div>
        <div className={styles.factRow}>
          <span className={styles.factLabel}>장소</span>
          <span className={styles.factValue}>{item.place}</span>
        </div>
        {item.target && (
          <div className={styles.factRow}>
            <span className={styles.factLabel}>참여 대상</span>
            <span className={styles.factValue}>{item.target}</span>
          </div>
        )}
      </section>

      {item.intro && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>활동 소개</h2>
          <p className={styles.body}>{item.intro}</p>
        </section>
      )}

      {item.notes.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>안내 사항</h2>
          <ul className={styles.list}>
            {item.notes.map((n) => (
              <li key={n} className={styles.listItem}>
                <span className={styles.bullet}>·</span>
                {n}
              </li>
            ))}
          </ul>
        </section>
      )}

      {showTeam && (
        <Link href="/my/team" className={styles.teamCard}>
          <div>
            <p className={styles.teamLabel}>내 조</p>
            <p className={styles.teamName}>{showTeam.teamName}</p>
          </div>
          <span className={styles.teamMore}>
            조원 {showTeam.members.length}명 보기&nbsp;&nbsp;›
          </span>
        </Link>
      )}

      {!isPast && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>참석 여부</h2>
          <AttendPicker activityId={item.id} initial={item.attend} />
        </section>
      )}
    </div>
  );
}
