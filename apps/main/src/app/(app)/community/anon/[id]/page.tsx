import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { findAnonAuthor, findAnonPost } from "@/lib/anon-posts";
import { getCurrentMember } from "@/lib/get-current-member";
import { AnonActions } from "./AnonActions";
import styles from "../anon.module.css";

export default async function AnonPostPage({ params }: PageProps<"/community/anon/[id]">) {
  const { id } = await params;
  const [post, me] = await Promise.all([findAnonPost(id), getCurrentMember()]);
  if (!post) notFound();

  // 관리자에게만 작성자를 묻는다. 관리자가 아니면 데이터베이스가 어차피 비워서 돌려준다
  const author = me?.role === "관리자" ? await findAnonAuthor(id) : null;
  const canDelete = post.isMine || (me !== null && me.role !== "부원");

  return (
    <div className={styles.page}>
      <PageHeader title="" back={{ href: "/community?tab=익명", label: "익명 게시판" }} />

      <div className={styles.head}>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.meta}>
          익명 · {post.date}
          {post.isMine && <span className={styles.mine}>내 글</span>}
        </p>
      </div>

      <article className={styles.article}>{post.body}</article>

      {author && (
        <p className={styles.adminNote}>
          <b>관리자에게만 보임</b> · 작성자 {author.name} ({author.studentId})
        </p>
      )}

      {canDelete && <AnonActions id={post.id} />}
    </div>
  );
}
