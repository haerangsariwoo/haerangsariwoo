"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { inboxMessages, type MessageKind } from "@/lib/inbox";
import styles from "./messages.module.css";

const FILTERS = ["전체", "안읽음", "공지", "봉사", "활동", "승인"] as const;
type Filter = (typeof FILTERS)[number];

export default function MessagesPage() {
  const [messages, setMessages] = useState(inboxMessages);
  const [filter, setFilter] = useState<Filter>("전체");

  const unread = messages.filter((m) => !m.read).length;

  const visible = useMemo(() => {
    if (filter === "전체") return messages;
    if (filter === "안읽음") return messages.filter((m) => !m.read);
    return messages.filter((m) => m.kind === (filter as MessageKind));
  }, [messages, filter]);

  function markRead(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  }

  function markAllRead() {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  }

  return (
    <div className={styles.page}>
      <PageHeader title="쪽지함" back={{ href: "/home", label: "홈" }} />

      <div className={styles.summary}>
        <div className={styles.summaryBody}>
          <p className={styles.summaryTitle}>
            {unread > 0 ? `읽지 않은 쪽지 ${unread}건` : "모든 쪽지를 확인했어요"}
          </p>
          <p className={styles.summaryMeta}>운영진이 보낸 안내와 승인 결과가 이곳에 도착해요.</p>
        </div>
        {unread > 0 && (
          <button type="button" className={styles.unreadPill} onClick={markAllRead}>
            모두 읽음
          </button>
        )}
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={cn(styles.filter, filter === f && styles.on)}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f}
            {f === "안읽음" && unread > 0 ? ` ${unread}` : ""}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {visible.length === 0 ? (
          <p className={styles.empty}>
            해당하는 쪽지가 없어요.
            <br />
            새 안내가 도착하면 알려드릴게요.
          </p>
        ) : (
          visible.map((m) => (
            <article
              key={m.id}
              className={cn(styles.item, m.read ? styles.read : styles.unread)}
            >
              <div className={styles.itemTop}>
                <span className={cn(styles.kind, styles[m.kind])}>{m.kind}</span>
                {!m.read && <span className={styles.newDot} aria-label="읽지 않음" />}
                <span className={styles.sentAt}>{m.sentAt}</span>
              </div>
              <p className={styles.itemTitle}>{m.title}</p>
              <p className={styles.itemBody}>{m.body}</p>
              <div className={styles.itemFoot}>
                {m.href && (
                  <Link
                    href={m.href as Route}
                    className={styles.itemLink}
                    onClick={() => markRead(m.id)}
                  >
                    바로가기 ›
                  </Link>
                )}
                {!m.read && (
                  <button
                    type="button"
                    className={styles.readButton}
                    onClick={() => markRead(m.id)}
                  >
                    읽음 표시
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <section className={styles.askCard}>
        <p className={styles.askTitle}>운영진에게 익명으로 문의하기</p>
        <p className={styles.askDesc}>
          이름이 드러나지 않는 채널톡 대화로 연결됩니다. 불편한 점이나 건의사항을 편하게 남겨주세요.
        </p>
        <button type="button" className={styles.askButton}>
          익명 문의 열기
        </button>
      </section>

      <p className={styles.note}>
        쪽지는 운영진이 보내는 단방향 안내입니다.
        <br />
        개인 연락처 대신 공식 채널로만 소통해요.
      </p>
    </div>
  );
}
