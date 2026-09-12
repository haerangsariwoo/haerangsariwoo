"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { Sheet, SheetGroup } from "@/components/layout/Sheet/Sheet";
import { createClient } from "@/lib/supabase/client";
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
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>(initialTab);
  const sorted = [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  /*
   * 차례 바꾸기.
   *
   * 평소에는 눌러서 게시글로 들어가는 목록이다. 그 상태로 화살표를 달면
   * 옮기려다 글이 열린다. 그래서 바꾸는 동안만 링크를 걷고 화살표를 둔다.
   */
  const [order, setOrder] = useState<Album[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const list = order ?? albums;

  function move(index: number, step: number) {
    const next = index + step;
    setOrder((prev) => {
      const cur = prev ?? albums;
      if (next < 0 || next >= cur.length) return cur;
      const out = [...cur];
      [out[index], out[next]] = [out[next], out[index]];
      return out;
    });
  }

  async function saveOrder() {
    if (!order || saving) return;
    setSaving(true);
    setOrderError(null);

    // 맨 위가 가장 큰 값. 매번 전부 다시 매겨야 값이 어긋나지 않는다
    for (let i = 0; i < order.length; i++) {
      const { error } = await supabase
        .from("albums")
        .update({ sort_order: order.length - i })
        .eq("id", order[i].id);
      if (error) {
        setSaving(false);
        setOrderError("차례를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
    }

    setSaving(false);
    setOrder(null);
    router.refresh();
  }

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
            {canPost && (
              /* 공지는 자리에서 바로 알려야 할 때가 많다 — 관리자 화면까지 갈 일이 없다 */
              <Link href="/community/notice/new" className={styles.writeRow}>
                <span className={styles.writePlus} aria-hidden="true">
                  ＋
                </span>
                공지 작성
              </Link>
            )}
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
            {canPost &&
              (order ? (
                <div className={styles.orderBar}>
                  <span className={styles.orderHint}>화살표로 차례를 옮기세요.</span>
                  <button
                    type="button"
                    className={styles.orderCancel}
                    onClick={() => setOrder(null)}
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={styles.orderSave}
                    onClick={saveOrder}
                    disabled={saving}
                  >
                    {saving ? "저장 중…" : "완료"}
                  </button>
                </div>
              ) : (
                /* 활동을 마치고 폰으로 바로 올리는 자리 — 관리자 화면까지 갈 일이 없다 */
                <div className={styles.writeBar}>
                  <Link href="/community/album/new" className={styles.writeRow}>
                    <span className={styles.writePlus} aria-hidden="true">
                      ＋
                    </span>
                    게시글 작성
                  </Link>
                  {albums.length > 1 && (
                    <button
                      type="button"
                      className={styles.orderStart}
                      onClick={() => setOrder(albums)}
                    >
                      차례 바꾸기
                    </button>
                  )}
                </div>
              ))}
            {orderError && <p className={styles.orderError}>{orderError}</p>}

            {order
              ? order.map((a, i) => (
                  <div key={a.id} className={cn(styles.albumRow, styles.albumRowStatic)}>
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
                    </span>
                    <div className={styles.albumFoot}>
                      <h2 className={styles.albumTitle}>{a.title}</h2>
                      <span className={styles.albumMeta}>{a.date}</span>
                    </div>
                    <div className={styles.moveCol}>
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || saving}
                        aria-label={`${a.title} 위로`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === list.length - 1 || saving}
                        aria-label={`${a.title} 아래로`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))
              : albums.map((a) => (
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
