"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { NoticeComposer } from "@/components/admin/NoticeComposer/NoticeComposer";
import { notices as seed, type NoticeItem } from "@/lib/community";
import { useSemester } from "../SemesterContext";
import styles from "../volunteers/volunteers.module.css";

export function NoticeTable() {
  const { readOnly } = useSemester();
  const [rows, setRows] = useState<NoticeItem[]>(seed);

  function togglePin(id: string) {
    setRows((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((n) => n.id !== id));
  }

  function add(notice: { title: string; body: string; category: string; pinned: boolean }) {
    const today = new Date();
    setRows((prev) => [
      {
        id: `n${Date.now()}`,
        category: notice.category,
        title: notice.title,
        author: "김우영 운영진",
        date: `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`,
        pinned: notice.pinned,
        body: [notice.body],
      } as NoticeItem,
      ...prev,
    ]);
  }

  // 고정된 공지를 위로
  const sorted = [...rows].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <>
      <NoticeComposer onCreate={add} disabled={readOnly} />

      <DataTable columns={["카테고리", "제목", "작성자", "작성일", "상단 고정", ""]}>
        {sorted.map((n) => (
          <tr key={n.id}>
            <td>
              <Badge tone={n.category === "필독" ? "orange" : "blue"}>{n.category}</Badge>
            </td>
            <td>{n.title}</td>
            <td className={tableStyles.muted}>{n.author}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{n.date}</td>
            <td>
              {n.pinned ? (
                <Badge tone="green">고정</Badge>
              ) : (
                <span className={tableStyles.muted}>—</span>
              )}
            </td>
            <td className={styles.rowActions}>
              <RowAction
                onClick={() => togglePin(n.id)}
                title={n.pinned ? "상단 고정 해제" : "상단에 고정"}
                disabled={readOnly}
              >
                {n.pinned ? "고정 해제" : "고정"}
              </RowAction>
              <RowAction onClick={() => remove(n.id)} disabled={readOnly}>
                삭제
              </RowAction>
            </td>
          </tr>
        ))}
        {sorted.length === 0 && (
          <tr>
            <td colSpan={6} className={tableStyles.muted}>
              등록된 공지가 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
