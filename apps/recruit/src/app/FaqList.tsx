"use client";

import * as Accordion from "@radix-ui/react-accordion";
import type { Faq } from "@/lib/recruit-config";
import styles from "./FaqList.module.css";

/**
 * 랜딩 하단 Q&A.
 * Radix Accordion 이라 키보드 방향키 이동과 aria-expanded 를 알아서 처리한다.
 *
 * 처음에는 전부 닫아 둔다. 하나만 열려 있으면 그 질문이 특별히 중요한
 * 것처럼 보이고, 목록 전체를 훑기도 어렵다.
 */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <Accordion.Root type="single" collapsible className={styles.list}>
      {faqs.map((f) => (
        <Accordion.Item key={f.q} value={f.q} className={styles.item}>
          <Accordion.Header>
            <Accordion.Trigger className={styles.trigger}>
              <span className={styles.mark} aria-hidden="true">
                Q
              </span>
              <span className={styles.question}>{f.q}</span>
              <span className={styles.chevron} aria-hidden="true">
                ⌄
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className={styles.content}>
            <p className={styles.answer}>{f.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
