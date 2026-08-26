import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { displayFileName } from "@/lib/storage-name";
import { Badge } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import styles from "./post.module.css";

const BUCKET = "board-files";
const SIGNED_URL_TTL = 60 * 30;

const CAT_TONE: Record<string, BadgeTone> = {
  회의록: "blue",
  "운영 공지": "orange",
  자료: "green",
  자유: "grey",
};

/** 본문 안의 `![설명](저장경로)` 한 줄 = 사진 한 장 */
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

interface PostRow {
  id: string;
  category: string;
  title: string;
  body: string;
  file_paths: string[];
  created_at: string;
  author: { name: string } | null;
}

type Block =
  | { kind: "text"; text: string }
  | { kind: "image"; alt: string; url: string | null };

/**
 * 본문을 문단과 사진으로 쪼갠다. 사진은 비공개 버킷에 있어 볼 때마다
 * 서명 주소를 새로 만들어야 하는데, 서버에서 그릴 때 만들어 두면
 * 화면이 뜬 뒤 주소가 만료될 일이 없다.
 */
function toBlocks(body: string, urlOf: (path: string) => string | null): Block[] {
  const blocks: Block[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ kind: "text", text });
    buffer = [];
  };

  for (const line of body.split("\n")) {
    const match = IMAGE_LINE.exec(line.trim());
    if (match) {
      flush();
      blocks.push({ kind: "image", alt: match[1], url: urlOf(match[2]) });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return blocks;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default async function BoardPostPage({ params }: PageProps<"/admin/board/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("board_posts")
    .select("id, category, title, body, file_paths, created_at, author:members(name)")
    .eq("id", id)
    .maybeSingle();

  const post = data as unknown as PostRow | null;
  if (!post) notFound();

  const { data: signed } = post.file_paths.length
    ? await supabase.storage.from(BUCKET).createSignedUrls(post.file_paths, SIGNED_URL_TTL)
    : { data: [] };

  const urlByPath = new Map<string, string>();
  (signed ?? []).forEach((s, i) => {
    if (s.signedUrl) urlByPath.set(post.file_paths[i], s.signedUrl);
  });

  const blocks = toBlocks(post.body, (path) => urlByPath.get(path) ?? null);
  const inlinePaths = new Set(
    post.body
      .split("\n")
      .map((line) => IMAGE_LINE.exec(line.trim())?.[2])
      .filter(Boolean) as string[],
  );
  // 본문에 안 쓰인 것만 아래 첨부파일로 내린다 — 같은 사진이 두 번 나오지 않게
  const attachments = post.file_paths.filter((p) => !inlinePaths.has(p));

  return (
    <article className={styles.page}>
      <Link href="/admin/board" className={styles.back}>
        ‹ 운영진 게시판
      </Link>

      <header className={styles.head}>
        <Badge tone={CAT_TONE[post.category] ?? "grey"}>{post.category}</Badge>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.meta}>
          {post.author?.name ?? "운영진"} 운영진 · {formatDate(post.created_at)}
        </p>
      </header>

      <div className={styles.body}>
        {blocks.length === 0 && <p className={styles.paragraph}>본문이 없습니다.</p>}
        {blocks.map((b, i) =>
          b.kind === "text" ? (
            <p key={i} className={styles.paragraph}>
              {b.text}
            </p>
          ) : b.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} className={styles.image} src={b.url} alt={b.alt} />
          ) : (
            <p key={i} className={cn(styles.paragraph, styles.missing)}>
              사진을 불러오지 못했습니다.
            </p>
          ),
        )}
      </div>

      {attachments.length > 0 && (
        <section className={styles.files}>
          <h2 className={styles.filesTitle}>첨부파일 {attachments.length}개</h2>
          <div className={styles.fileRow}>
            {attachments.map((path) => {
              const url = urlByPath.get(path);
              return url ? (
                <a
                  key={path}
                  className={styles.fileChip}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {displayFileName(path)}
                </a>
              ) : (
                <span key={path} className={cn(styles.fileChip, styles.missing)}>
                  {displayFileName(path)}
                </span>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
