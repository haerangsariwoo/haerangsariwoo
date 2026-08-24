"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Shell } from "@/components/layout/Shell/Shell";
import { cn } from "@/lib/cn";
import { instagramPosts, type InstagramPost } from "@/lib/instagram-feed";
import styles from "./instagram.module.css";

function PostCard({ post }: { post: InstagramPost }) {
  const [index, setIndex] = useState(0);
  const total = post.images.length;

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + total) % total),
    [total],
  );

  return (
    <article className={styles.post}>
      <div className={styles.photoWrap}>
        {post.images.map((src, i) => (
          <div key={src} className={cn(styles.photo, i === index && styles.photoActive)} aria-hidden={i !== index}>
            <Image src={src} alt="" fill sizes="430px" unoptimized />
          </div>
        ))}

        {total > 1 && (
          <>
            <button
              type="button"
              className={cn(styles.arrow, styles.prev)}
              onClick={() => go(-1)}
              aria-label="이전 사진"
            >
              ‹
            </button>
            <button
              type="button"
              className={cn(styles.arrow, styles.next)}
              onClick={() => go(1)}
              aria-label="다음 사진"
            >
              ›
            </button>
            <div className={styles.dots}>
              {post.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={cn(styles.dot, i === index && styles.dotActive)}
                  aria-label={`${i + 1}번째 사진 보기`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.date}>{post.date}</span>
        <p className={styles.caption}>{post.caption}</p>
      </div>
    </article>
  );
}

export default function InstagramPage() {
  return (
    <Shell title="인스타그램" back="/">
      <p className={styles.notice}>
        인스타그램은 실시간으로 불러오지 않으며, 공식 계정(@haerangsariwoo)의 대표 게시물을
        예시로 보여줍니다.
      </p>

      <div className={styles.feed}>
        {instagramPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </Shell>
  );
}
