import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { findNotice } from "@/lib/notices";
import { getCurrentMember } from "@/lib/get-current-member";
import { NoticeActions } from "./NoticeActions";
import styles from "./notice.module.css";

export default async function NoticeDetailPage({ params }: PageProps<"/community/notice/[id]">) {
  const { id } = await params;
  const [item, me] = await Promise.all([findNotice(id), getCurrentMember()]);
  if (!item) notFound();

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community", label: "커뮤니티" }} />

      <div className={styles.head}>
        <span className={cn(styles.catTag, item.category === "필독" && styles.urgent)}>
          {item.category}
        </span>
        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.meta}>
          {item.author} · {item.date}
        </p>
      </div>

      <article className={styles.article}>
        {item.body.map((p, i) => (
          <p key={i} className={styles.paragraph}>
            {p}
          </p>
        ))}
      </article>

      {me && me.role !== "부원" && <NoticeActions id={item.id} title={item.title} />}
    </div>
  );
}
