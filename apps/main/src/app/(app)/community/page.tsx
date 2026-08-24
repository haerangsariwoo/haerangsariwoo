"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";
import { albumPreviewTiles, albums as albumsSeed, notices, type Album } from "@/lib/community";
import { useContentOverride } from "@/lib/content-store";
import { defaultPhotoFocus } from "@/lib/photo-focus";
import styles from "./community.module.css";

type Tab = "공지" | "앨범";

export default function CommunityPage() {
  // useSearchParams 는 직접 접속 시 서버 렌더에서 suspend 하므로 경계로 감싼다
  return (
    <Suspense fallback={<CommunityBoard initialTab="공지" />}>
      <CommunityFromQuery />
    </Suspense>
  );
}

/** 홈의 "앨범 전체보기"처럼 ?tab=앨범 으로 들어오면 앨범 탭을 연다 */
function CommunityFromQuery() {
  const params = useSearchParams();
  return <CommunityBoard initialTab={params.get("tab") === "앨범" ? "앨범" : "공지"} />;
}

function CommunityBoard({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const albums = useContentOverride<Album[]>("albums", albumsSeed);
  const sorted = [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <Sheet>
      <SheetGroup>
        {/* 제목과 탭은 한 블록에 둔다. 둘로 나누면 사이에 실선이 생긴다. */}
        <div className={styles.head}>
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
        </div>
      </SheetGroup>

      <SheetGroup>
        {tab === "공지" ? (
          <div className={styles.list}>
            {sorted.map((n) => (
              <Link
                key={n.id}
                href={`/community/notice/${n.id}`}
                className={cn(styles.noticeRow, n.pinned && styles.pinned)}
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
              <Link key={a.id} href={`/community/album/${a.id}`} className={styles.albumRow}>
                <div className={styles.albumGrid}>
                  {albumPreviewTiles(a, 4).map((tile, i) => {
                    const focus = tile.photo?.focus ?? defaultPhotoFocus;
                    return (
                      <span key={i} className={cn(styles.photo, !tile.photo && styles[tile.tone])}>
                        {tile.photo && (
                          <Image
                            className={styles.photoImage}
                            src={tile.photo.url}
                            alt=""
                            fill
                            sizes="90px"
                            unoptimized
                            style={{
                              objectPosition: `${focus.x}% ${focus.y}%`,
                              transform: `scale(${focus.zoom})`,
                              transformOrigin: `${focus.x}% ${focus.y}%`,
                            }}
                          />
                        )}
                      </span>
                    );
                  })}
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
      </SheetGroup>
    </Sheet>
  );
}
