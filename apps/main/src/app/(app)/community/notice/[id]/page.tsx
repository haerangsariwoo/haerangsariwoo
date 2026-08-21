import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { findNotice, notices } from "@/lib/community";
import styles from "./notice.module.css";

export function generateStaticParams() {
  return notices.map((n) => ({ id: n.id }));
}

export default async function NoticeDetailPage({ params }: PageProps<"/community/notice/[id]">) {
  const { id } = await params;
  const item = findNotice(id);
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
    </div>
  );
}
