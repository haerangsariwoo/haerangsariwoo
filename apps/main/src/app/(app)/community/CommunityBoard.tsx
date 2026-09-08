"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";
import { tonesFor, type Album } from "@/lib/community";
import type { NoticeItem } from "@/lib/notices";
import styles from "./community.module.css";

type Tab = "공지" | "앨범";

interface BoardProps {
  notices: NoticeItem[];
  albums: Album[];
  /** 운영진·관리자에게만 글쓰기 단추를 보여준다 */
  canPost: boolean;
}

export function CommunityBoard({ notices, albums, canPost }: BoardProps) {
  // useSearchParams 는 직접 접속 시 서버 렌더에서 suspend 하므로 경계로 감싼다
  return (
    <Suspense
      fallback={
        <CommunityView notices={notices} albums={albums} canPost={canPost} initialTab="공지" />
      }
    >
      <CommunityFromQuery notices={notices} albums={albums} canPost={canPost} />
    </Suspense>
  );
}

/** 홈의 "앨범 전체보기"처럼 ?tab=앨범 으로 들어오면 앨범 탭을 연다 */
function CommunityFromQuery({ notices, albums, canPost }: BoardProps) {
  const params = useSearchParams();
  return (
    <CommunityView
      notices={notices}
      albums={albums}
      canPost={canPost}
      initialTab={params.get("tab") === "앨범" ? "앨범" : "공지"}
    />
  );
}

function CommunityView({ notices, albums, canPost, initialTab }: BoardProps & { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
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
            {sorted.length === 0 && <p className={styles.noticeMeta}>아직 등록된 공지가 없어요.</p>}
          </div>
        ) : (
          <div className={styles.list}>
            {canPost && (
              /* 활동을 마치고 폰으로 바로 올리는 자리 — 관리자 화면까지 갈 일이 없다 */
              <Link href="/community/album/new" className={styles.writeRow}>
                <span className={styles.writePlus} aria-hidden="true">
                  ＋
                </span>
                사진과 글 올리기
              </Link>
            )}
            {albums.map((a) => (
              <Link key={a.id} href={`/community/album/${a.id}`} className={styles.albumRow}>
                {/* 대표 사진 한 장만 — 넉 장을 깔면 목록이 사진첩처럼 보인다 */}
                <span className={cn(styles.cover, !a.photos[0] && styles[tonesFor(a.id)[0]])}>
                  {a.photos[0] && (
                    <Image
                      className={styles.photoImage}
                      src={a.photos[0].url}
                      alt=""
                      fill
                      sizes="90px"
                      unoptimized
                      style={{
                        objectPosition: `${a.photos[0].focus.x}% ${a.photos[0].focus.y}%`,
                        transform: `scale(${a.photos[0].focus.zoom})`,
                        transformOrigin: `${a.photos[0].focus.x}% ${a.photos[0].focus.y}%`,
                      }}
                    />
                  )}
                  {a.photoCount > 1 && <span className={styles.coverCount}>{a.photoCount}</span>}
                </span>
                <div className={styles.albumFoot}>
                  <h2 className={styles.albumTitle}>{a.title}</h2>
                  {a.body && <p className={styles.albumBody}>{a.body}</p>}
                  <span className={styles.albumMeta}>
                    {a.date}
                    {a.photoCount > 0 && ` · 사진 ${a.photoCount}장`}
                  </span>
                </div>
              </Link>
            ))}
            {albums.length === 0 && <p className={styles.noticeMeta}>아직 올라온 게시글이 없어요.</p>}
          </div>
        )}
      </SheetGroup>
    </Sheet>
  );
}
