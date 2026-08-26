"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import type { BadgeTone } from "@/components/admin/DataTable/DataTable";
import { displayFileName } from "@/lib/storage-name";
import type { VerifyState } from "@/lib/verify";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

const STATE_TONE: Record<VerifyState, BadgeTone> = {
  대기: "orange",
  승인: "green",
  반려: "grey",
};

const BUCKET = "proof-files";

interface ProofRow {
  id: string;
  source: "1365" | "vms";
  activity_title: string;
  activity_org: string;
  activity_date: string;
  hours: number;
  photo_paths: string[];
  memo: string;
  status: VerifyState;
  reject_reason: string | null;
  created_at: string;
  member: { name: string; student_id: string } | null;
}

const SELECT =
  "id, source, activity_title, activity_org, activity_date, hours, photo_paths, memo, status, reject_reason, created_at, member:member_id(name, student_id)";

/**
 * 부원이 /verify 에서 올린 1365·VMS 증빙을 확인하고 시간을 인정한다.
 * 승인·반려하면 DB 트리거가 그 부원 쪽지함으로 결과를 보낸다.
 */
export function HourTable() {
  const { readOnly, matches } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<ProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"대기" | "all" | VerifyState>("대기");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  /** 펼쳐서 증빙 사진을 보고 있는 신청 */
  const [openId, setOpenId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, { url: string; name: string }[]>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("proof_submissions")
        .select(SELECT)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) setError("증빙을 불러오지 못했습니다.");
      else setRows((data ?? []) as unknown as ProofRow[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const visible = rows.filter((h) => {
    const name = h.member?.name ?? "";
    const hitQ = !q.trim() || name.includes(q.trim()) || h.activity_title.includes(q.trim());
    const hitF = filter === "all" || h.status === filter;
    return hitQ && hitF && matches(h.activity_date);
  });

  const pending = rows.filter((h) => h.status === "대기");
  const pendingVisible = visible.filter((h) => h.status === "대기");
  const allChecked = pendingVisible.length > 0 && pendingVisible.every((h) => checked.has(h.id));

  async function setState(ids: string[], status: VerifyState, rejectReason?: string) {
    if (ids.length === 0) return;
    const prev = rows;
    setRows((cur) =>
      cur.map((h) =>
        ids.includes(h.id) ? { ...h, status, reject_reason: rejectReason ?? null } : h,
      ),
    );
    setChecked((cur) => {
      const next = new Set(cur);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    const { error: updateError } = await supabase
      .from("proof_submissions")
      .update({ status, reject_reason: rejectReason ?? null })
      .in("id", ids);
    if (updateError) {
      setRows(prev);
      setError("처리 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  async function reject(id: string) {
    const reason = window.prompt("반려 사유를 적어주세요. 부원 쪽지함으로 그대로 전달됩니다.");
    if (reason === null) return;
    await setState([id], "반려", reason.trim() || "반려 사유를 확인해 주세요.");
  }

  /** 잘못 올라온 증빙을 아예 없앤다 — 사진까지 지우므로 되돌릴 수 없다 */
  async function remove(row: ProofRow) {
    const who = row.member?.name ?? "";
    if (
      !window.confirm(
        `${who}님의 "${row.activity_title}" 증빙을 삭제할까요? 올린 사진도 함께 지워지며 되돌릴 수 없습니다.`,
      )
    )
      return;

    const prev = rows;
    setRows((cur) => cur.filter((h) => h.id !== row.id));

    if (row.photo_paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(row.photo_paths);
    }
    const { error: deleteError } = await supabase
      .from("proof_submissions")
      .delete()
      .eq("id", row.id);
    if (deleteError) {
      setRows(prev);
      setError("삭제하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  /** 비공개 버킷이라 볼 때마다 짧게 유효한 링크를 새로 만든다 */
  async function toggleOpen(row: ProofRow) {
    if (openId === row.id) {
      setOpenId(null);
      return;
    }
    setOpenId(row.id);
    if (photoUrls[row.id] || row.photo_paths.length === 0) return;

    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(row.photo_paths, 300);
    const links = (data ?? []).flatMap((d, i) =>
      d.signedUrl ? [{ url: d.signedUrl, name: displayFileName(row.photo_paths[i]) }] : [],
    );
    setPhotoUrls((prev) => ({ ...prev, [row.id]: links }));
  }

  return (
    <Panel
      title="봉사시간 승인"
      count={`대기 ${pending.length}건`}
      desc="부원이 제출한 1365·VMS 증빙입니다. 승인하면 누적 봉사시간에 반영되고, 결과는 부원 쪽지함으로 자동 안내됩니다."
    >
      {error && <p className={tableStyles.muted}>{error}</p>}

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
          onChange={(e) => setFilter(e.target.value as typeof filter)}
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
          onClick={() => setState([...checked], "승인")}
          disabled={readOnly || checked.size === 0}
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
            disabled={readOnly}
            onChange={() =>
              setChecked(allChecked ? new Set() : new Set(pendingVisible.map((h) => h.id)))
            }
          />,
          "이름",
          "학번",
          "봉사활동",
          "출처",
          "활동일",
          "신청 시간",
          "증빙",
          "상태",
          "",
        ]}
        isEmpty={!loading && visible.length === 0}
        empty={loading ? "불러오는 중..." : "조건에 맞는 신청이 없습니다."}
      >
        {visible.map((h) => (
          <tr key={h.id}>
            <td>
              {h.status === "대기" && (
                <input
                  type="checkbox"
                  aria-label={`${h.member?.name ?? ""} 선택`}
                  checked={checked.has(h.id)}
                  disabled={readOnly}
                  onChange={() =>
                    setChecked((prev) => {
                      const next = new Set(prev);
                      if (next.has(h.id)) next.delete(h.id);
                      else next.add(h.id);
                      return next;
                    })
                  }
                />
              )}
            </td>
            <td>{h.member?.name ?? "(탈퇴)"}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>
              {h.member?.student_id ?? "—"}
            </td>
            <td className={tableStyles.muted}>
              {h.activity_title}
              {h.activity_org && ` · ${h.activity_org}`}
              {openId === h.id && (
                <>
                  {h.memo && <p className={tableStyles.muted}>메모 · {h.memo}</p>}
                  <p className={styles.rowActions}>
                    {(photoUrls[h.id] ?? []).map((p) => (
                      <a
                        key={p.url}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={tableStyles.muted}
                      >
                        {p.name}
                      </a>
                    ))}
                  </p>
                  {h.reject_reason && (
                    <p className={tableStyles.muted}>반려 사유 · {h.reject_reason}</p>
                  )}
                </>
              )}
            </td>
            <td className={tableStyles.muted}>{h.source === "1365" ? "1365" : "VMS"}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{h.activity_date}</td>
            <td className={tableStyles.numeric}>{h.hours}시간</td>
            <td className={tableStyles.muted}>
              <RowAction onClick={() => toggleOpen(h)} title="증빙 사진 보기">
                사진 {h.photo_paths.length}장
              </RowAction>
            </td>
            <td>
              <Badge tone={STATE_TONE[h.status]}>{h.status}</Badge>
            </td>
            <td className={styles.rowActions}>
              {h.status === "대기" ? (
                <>
                  <RowAction primary onClick={() => setState([h.id], "승인")} disabled={readOnly}>
                    승인
                  </RowAction>
                  <RowAction onClick={() => reject(h.id)} disabled={readOnly}>
                    반려
                  </RowAction>
                </>
              ) : (
                <RowAction
                  onClick={() => setState([h.id], "대기")}
                  title="대기 상태로 되돌리기"
                  disabled={readOnly}
                >
                  되돌리기
                </RowAction>
              )}
              <RowAction
                onClick={() => remove(h)}
                title="증빙을 사진까지 완전히 삭제"
                disabled={readOnly}
              >
                삭제
              </RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
