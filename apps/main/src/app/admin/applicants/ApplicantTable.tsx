"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

const STATE_TONE: Record<string, BadgeTone> = {
  참여확정: "green",
  신청완료: "blue",
  대기: "orange",
  불참: "danger",
  노쇼: "danger",
};

/** 상태를 누를 때마다 이 순서로 돈다 */
const CYCLE = ["신청완료", "참여확정", "불참", "노쇼"] as const;

interface Row {
  id: string;
  applied_at: string;
  state: string;
  wait_no: number | null;
  members: { name: string; student_id: string; cohort: string } | null;
  internal_activities: { title: string } | null;
}

export function ApplicantTable() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [volunteer, setVolunteer] = useState("all");
  const [state, setState] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("internal_activity_applications")
        .select("id, applied_at, state, wait_no, members(name, student_id, cohort), internal_activities(title)")
        .order("applied_at", { ascending: false });
      if (!cancelled) {
        setRows((data ?? []) as unknown as Row[]);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const volunteers = useMemo(
    () => [...new Set(rows.map((a) => a.internal_activities?.title).filter((t): t is string => !!t))],
    [rows],
  );

  const visible = rows.filter((a) => {
    const name = a.members?.name ?? "";
    const studentId = a.members?.student_id ?? "";
    const title = a.internal_activities?.title ?? "";
    const hitQ = !q.trim() || name.includes(q.trim()) || studentId.includes(q.trim());
    const hitV = volunteer === "all" || title === volunteer;
    const hitS = state === "all" || a.state === state;
    return hitQ && hitV && hitS;
  });

  async function setRowState(id: string, next: string) {
    const prev = rows;
    setRows((cur) => cur.map((a) => (a.id === id ? { ...a, state: next, wait_no: null } : a)));
    const { error } = await supabase
      .from("internal_activity_applications")
      .update({ state: next, wait_no: null })
      .eq("id", id);
    if (error) setRows(prev);
  }

  /** 대기자는 참여확정으로 승격, 나머지는 상태를 한 칸 돌린다 */
  function advance(id: string) {
    const row = rows.find((a) => a.id === id);
    if (!row) return;
    if (row.state === "대기") {
      setRowState(id, "참여확정");
      return;
    }
    const i = CYCLE.indexOf(row.state as (typeof CYCLE)[number]);
    setRowState(id, CYCLE[(i + 1) % CYCLE.length]);
  }

  /** 지금 보이는 신청완료·대기자를 한 번에 참여확정으로 */
  async function confirmAll() {
    const ids = visible.filter((a) => a.state !== "참여확정").map((a) => a.id);
    if (ids.length === 0) return;
    const prev = rows;
    setRows((cur) => cur.map((a) => (ids.includes(a.id) ? { ...a, state: "참여확정", wait_no: null } : a)));
    const { error } = await supabase
      .from("internal_activity_applications")
      .update({ state: "참여확정", wait_no: null })
      .in("id", ids);
    if (error) setRows(prev);
  }

  /** 출석 처리 — 참여확정을 그대로 두고 신청완료는 노쇼로 */
  async function markAttendance() {
    const ids = visible.filter((a) => a.state === "신청완료").map((a) => a.id);
    if (ids.length === 0) return;
    const prev = rows;
    setRows((cur) => cur.map((a) => (ids.includes(a.id) ? { ...a, state: "노쇼" } : a)));
    const { error } = await supabase.from("internal_activity_applications").update({ state: "노쇼" }).in("id", ids);
    if (error) setRows(prev);
  }

  const pendingCount = visible.filter((a) => a.state !== "참여확정").length;

  return (
    <Panel
      title="신청자·대기자 관리"
      count={`${rows.length}명`}
      desc="참여 여부는 활동 종료 후 운영진이 직접 처리합니다."
    >
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
          disabled={readOnly || pendingCount === 0}
        >
          일괄 참여확정{pendingCount > 0 ? ` ${pendingCount}` : ""}
        </button>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={markAttendance}
          disabled={readOnly}
        >
          출석 처리
        </button>
      </div>

      <DataTable
        columns={["이름", "학번", "기수", "신청 봉사", "신청일", "상태", ""]}
        isEmpty={!loading && visible.length === 0}
        empty={loading ? "불러오는 중..." : "조건에 맞는 신청자가 없습니다."}
      >
        {visible.map((a) => (
          <tr key={a.id}>
            <td>{a.members?.name ?? "—"}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{a.members?.student_id ?? "—"}</td>
            <td className={tableStyles.muted}>{a.members?.cohort ?? "—"}</td>
            <td className={tableStyles.muted}>{a.internal_activities?.title ?? "—"}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>
              {new Date(a.applied_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
            </td>
            <td>
              <Badge tone={STATE_TONE[a.state]}>
                {a.state}
                {a.wait_no ? ` ${a.wait_no}번` : ""}
              </Badge>
            </td>
            <td>
              <RowAction
                primary={a.state === "대기"}
                onClick={() => advance(a.id)}
                title={a.state === "대기" ? "참여확정으로 승격" : "다음 상태로 변경"}
                disabled={readOnly}
              >
                {a.state === "대기" ? "승격" : "변경"}
              </RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
