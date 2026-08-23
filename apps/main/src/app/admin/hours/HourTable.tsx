"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import { hourRequests as seed } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

const STATE_TONE: Record<string, BadgeTone> = {
  대기: "orange",
  승인: "green",
  반려: "grey",
};

export function HourTable() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("대기");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const visible = rows.filter((h) => {
    const hitQ = !q.trim() || h.name.includes(q.trim()) || h.volunteer.includes(q.trim());
    const hitF = filter === "all" || h.state === filter;
    return hitQ && hitF;
  });

  function setState(id: string, state: "승인" | "반려" | "대기") {
    setRows((prev) => prev.map((h) => (h.id === id ? { ...h, state } : h)));
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function approveChecked() {
    setRows((prev) => prev.map((h) => (checked.has(h.id) ? { ...h, state: "승인" } : h)));
    setChecked(new Set());
  }

  const pendingVisible = visible.filter((h) => h.state === "대기");
  const allChecked = pendingVisible.length > 0 && pendingVisible.every((h) => checked.has(h.id));

  return (
    <>
      <div className={toolbar.toolbar}>
        <input
          className={toolbar.search}
          placeholder="이름·봉사명 검색"
          aria-label="승인 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={toolbar.select}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="상태 필터"
        >
          <option value="대기">상태: 대기</option>
          <option value="all">전체</option>
          <option value="승인">승인</option>
          <option value="반려">반려</option>
        </select>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={approveChecked}
          disabled={checked.size === 0}
        >
          선택 항목 일괄 승인{checked.size > 0 ? ` ${checked.size}` : ""}
        </button>
      </div>

      <DataTable
        columns={[
          <input
            key="all"
            type="checkbox"
            aria-label="대기 항목 전체 선택"
            checked={allChecked}
            onChange={() =>
              setChecked(allChecked ? new Set() : new Set(pendingVisible.map((h) => h.id)))
            }
          />,
          "이름",
          "학번",
          "봉사활동",
          "활동일",
          "신청 시간",
          "증빙",
          "상태",
          "",
        ]}
      >
        {visible.map((h) => (
          <tr key={h.id}>
            <td>
              {h.state === "대기" && (
                <input
                  type="checkbox"
                  aria-label={`${h.name} 선택`}
                  checked={checked.has(h.id)}
                  onChange={() => toggleCheck(h.id)}
                />
              )}
            </td>
            <td>{h.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{h.studentId}</td>
            <td className={tableStyles.muted}>{h.volunteer}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{h.date}</td>
            <td className={tableStyles.numeric}>{h.hours}시간</td>
            <td className={tableStyles.muted}>{h.proof}</td>
            <td>
              <Badge tone={STATE_TONE[h.state]}>{h.state}</Badge>
            </td>
            <td className={styles.rowActions}>
              {h.state === "대기" ? (
                <>
                  <RowAction primary onClick={() => setState(h.id, "승인")}>
                    승인
                  </RowAction>
                  <RowAction onClick={() => setState(h.id, "반려")}>반려</RowAction>
                </>
              ) : (
                <RowAction onClick={() => setState(h.id, "대기")} title="대기 상태로 되돌리기">
                  되돌리기
                </RowAction>
              )}
            </td>
          </tr>
        ))}
        {visible.length === 0 && (
          <tr>
            <td colSpan={9} className={tableStyles.muted}>
              조건에 맞는 신청이 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
