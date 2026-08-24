"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, DataTable, tableStyles } from "@/components/admin/DataTable/DataTable";
import { pendingHours as pendingHoursSeed, todayVolunteers } from "@/lib/admin-data";
import { useSemester } from "./SemesterContext";
import styles from "./dashboard.module.css";

const STATUS_OPTIONS = [
  { value: "all", label: "상태: 전체" },
  { value: "진행 예정", label: "진행 예정" },
  { value: "진행 중", label: "진행 중" },
  { value: "모집 마감", label: "모집 마감" },
];

/** "오늘의 봉사·출석" — 검색·상태 필터가 실제로 목록을 걸러낸다 */
export function TodayVolunteersPanel() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const visible = todayVolunteers.filter((v) => {
    const hitQ = !q.trim() || v.title.includes(q.trim());
    const hitStatus = status === "all" || v.status === status;
    return hitQ && hitStatus;
  });

  return (
    <>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="봉사명 검색"
          aria-label="봉사 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="상태 필터"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={["봉사활동", "시간", "신청/정원", "출석", "상태"]}>
        {visible.map((v) => (
          <tr key={v.id}>
            <td>{v.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{v.time}</td>
            <td className={tableStyles.numeric}>{v.applied}</td>
            <td className={tableStyles.numeric}>{v.attended}</td>
            <td>
              <Badge tone={v.tone}>{v.status}</Badge>
            </td>
          </tr>
        ))}
        {visible.length === 0 && (
          <tr>
            <td colSpan={5} className={tableStyles.muted}>
              조건에 맞는 봉사가 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}

/**
 * "봉사시간 승인 대기" — 체크해서 일괄 승인하면 목록에서 빠진다.
 * 실제 승인 처리(증빙 확인 등)는 /admin/hours 에서 하므로 "검토"
 * 버튼은 거기로 보낸다 — 같은 화면을 두 곳에 만들지 않는다.
 */
export function PendingHoursPanel() {
  const { readOnly } = useSemester();
  const [rows, setRows] = useState(pendingHoursSeed);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function approveChecked() {
    setRows((prev) => prev.filter((p) => !checked.has(p.id)));
    setChecked(new Set());
  }

  return (
    <>
      <div className={styles.approvalList}>
        {rows.map((p) => (
          <label key={p.id} className={styles.approvalRow}>
            <input
              type="checkbox"
              className={styles.approvalCheck}
              checked={checked.has(p.id)}
              onChange={() => toggle(p.id)}
              aria-label={`${p.name} 선택`}
              disabled={readOnly}
            />
            <span className={cn(styles.approvalAvatar, styles[p.tone])}>{p.name.charAt(0)}</span>
            <div className={styles.approvalBody}>
              <p className={styles.approvalName}>{p.name}</p>
              <p className={styles.approvalActivity}>{p.activity}</p>
            </div>
            <span className={styles.approvalHours}>{p.hours}</span>
            <Link href="/admin/hours" className={styles.approvalButton}>
              검토
            </Link>
          </label>
        ))}
        {rows.length === 0 && (
          <p className={cn(tableStyles.muted, styles.approvalEmpty)}>승인 대기 중인 실적이 없습니다.</p>
        )}
      </div>

      {rows.length > 0 && (
        <button
          type="button"
          className={styles.batchBar}
          disabled={readOnly || checked.size === 0}
          onClick={approveChecked}
        >
          {checked.size > 0 ? "☑" : "☐"} {checked.size}건 선택 · 일괄 승인
        </button>
      )}
    </>
  );
}
