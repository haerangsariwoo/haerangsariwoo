"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { albums, notices } from "@/lib/community";
import { noticeFor } from "@/lib/get-notice";
import styles from "./community.module.css";

type Tab = "공지" | "앨범";

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("공지");
  const sorted = [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className={styles.page}>
      <PageHeader title="커뮤니티" />

      <div className={styles.segment} role="tablist" aria-label="커뮤니티 구분">
        {(["공지", "앨범"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={cn(styles.segmentBtn, tab === t && styles.active)}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "공지" ? (
        <div className={styles.list}>
          {sorted.map((n) => (
            <Link
              key={n.id}
              href={`/community/notice/${n.id}`}
              className={cn(styles.noticeCard, n.pinned && styles.pinned)}
            >
              <div className={styles.noticeTop}>
                <span className={cn(styles.catTag, n.category === "필독" && styles.urgent)}>
                  {n.category}
                </span>
                {n.pinned && <span className={styles.pinFlag}>상단 고정</span>}
              </div>
              <h2 className={styles.noticeTitle}>{n.title}</h2>
              <p className={styles.noticeMeta}>
                {n.author} · {n.date}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {albums.map((a) => (
            <Link key={a.id} href={`/community/album/${a.id}`} className={styles.albumCard}>
              <div className={styles.albumGrid}>
                {a.tones.map((tone, i) => (
                  <span key={i} className={cn(styles.photo, styles[tone])} />
                ))}
              </div>
              <div className={styles.albumFoot}>
                <h2 className={styles.albumTitle}>{a.title}</h2>
                <span className={styles.albumMeta}>
                  사진 {a.photoCount}장 · {a.date}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className={styles.note}>
        {noticeFor("커뮤니티")}
      </p>
    </div>
  );
}
