"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import { applicants as seed } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

const STATE_TONE: Record<string, BadgeTone> = {
  참여확정: "green",
  신청완료: "blue",
  대기: "orange",
  불참: "grey",
  노쇼: "grey",
};

/** 상태를 누를 때마다 이 순서로 돈다 */
const CYCLE = ["신청완료", "참여확정", "불참", "노쇼"] as const;

export function ApplicantTable() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [volunteer, setVolunteer] = useState("all");
  const [state, setState] = useState("all");

  const volunteers = useMemo(() => [...new Set(seed.map((a) => a.volunteer))], []);

  const visible = rows.filter((a) => {
    const hitQ =
      !q.trim() || a.name.includes(q.trim()) || String(a.studentId).includes(q.trim());
    const hitV = volunteer === "all" || a.volunteer === volunteer;
    const hitS = state === "all" || a.state === state;
    return hitQ && hitV && hitS;
  });

  /** 대기자는 참여확정으로 승격, 나머지는 상태를 한 칸 돌린다 */
  function advance(id: string) {
    setRows((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.state === "대기") return { ...a, state: "참여확정", waitNo: undefined };
        const i = CYCLE.indexOf(a.state as (typeof CYCLE)[number]);
        return { ...a, state: CYCLE[(i + 1) % CYCLE.length] };
      }),
    );
  }

  /** 지금 보이는 신청완료·대기자를 한 번에 참여확정으로 */
  function confirmAll() {
    const ids = new Set(visible.filter((a) => a.state !== "참여확정").map((a) => a.id));
    setRows((prev) =>
      prev.map((a) => (ids.has(a.id) ? { ...a, state: "참여확정", waitNo: undefined } : a)),
    );
  }

  /** 출석 처리 — 참여확정을 그대로 두고 신청완료는 노쇼로 */
  function markAttendance() {
    const ids = new Set(visible.map((a) => a.id));
    setRows((prev) =>
      prev.map((a) => (ids.has(a.id) && a.state === "신청완료" ? { ...a, state: "노쇼" } : a)),
    );
  }

  const pendingCount = visible.filter((a) => a.state !== "참여확정").length;

  return (
    <>
      <div className={toolbar.toolbar}>
        <input
          className={toolbar.search}
          placeholder="이름·학번 검색"
          aria-label="신청자 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={toolbar.select}
          value={volunteer}
          onChange={(e) => setVolunteer(e.target.value)}
          aria-label="봉사 필터"
        >
          <option value="all">봉사: 전체</option>
          {volunteers.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          className={toolbar.select}
          value={state}
          onChange={(e) => setState(e.target.value)}
          aria-label="상태 필터"
        >
          <option value="all">상태: 전체</option>
          <option value="참여확정">참여확정</option>
          <option value="신청완료">신청완료</option>
          <option value="대기">대기</option>
          <option value="불참">불참</option>
          <option value="노쇼">노쇼</option>
        </select>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={toolbar.button}
          onClick={confirmAll}
          disabled={pendingCount === 0}
        >
          일괄 참여확정{pendingCount > 0 ? ` ${pendingCount}` : ""}
        </button>
        <button type="button" className={cn(toolbar.button, toolbar.primary)} onClick={markAttendance}>
          출석 처리
        </button>
      </div>

      <DataTable columns={["이름", "학번", "기수", "신청 봉사", "신청일", "상태", ""]}>
        {visible.map((a) => (
          <tr key={a.id}>
            <td>{a.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.studentId}</td>
            <td className={tableStyles.muted}>{a.cohort}</td>
            <td className={tableStyles.muted}>{a.volunteer}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.appliedAt}</td>
            <td>
              <Badge tone={STATE_TONE[a.state]}>
                {a.state}
                {a.waitNo ? ` ${a.waitNo}번` : ""}
              </Badge>
            </td>
            <td>
              <RowAction
                primary={a.state === "대기"}
                onClick={() => advance(a.id)}
                title={a.state === "대기" ? "참여확정으로 승격" : "다음 상태로 변경"}
              >
                {a.state === "대기" ? "승격" : "변경"}
              </RowAction>
            </td>
          </tr>
        ))}
        {visible.length === 0 && (
          <tr>
            <td colSpan={7} className={tableStyles.muted}>
              조건에 맞는 신청자가 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
