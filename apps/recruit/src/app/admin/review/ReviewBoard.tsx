"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { LengthFilter, SortSelect } from "@/components/admin/ListFilters";
import {
  emptyLength,
  inLength,
  sortRows,
  type LengthRange,
  type NameSort,
} from "@/lib/list-filters";
import { createClient } from "@/lib/supabase/client";
import type { Applicant, FinalResult, FirstResult } from "@/lib/admin-data";

const RESULT_OPTIONS = [
  { value: "합격", label: "합격", tone: "pass", activeBg: "var(--brand-blue-500)" },
  { value: "불합격", label: "불합격", tone: "fail", activeBg: "#cf4444" },
  { value: "대기", label: "보류", tone: "hold", activeBg: "#8a8a8a" },
] as const;

/** 합격/불합격/보류를 정하는 연결된 세 칸. 클릭한 칸의 색으로 즉시 굳는다. */
function ResultSegmented<T extends string>({
  value,
  onChange,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={ui.segmented} role="group" aria-label="심사 결과">
      {RESULT_OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            className={cn(ui.segment, ui[o.tone])}
            style={active ? { background: o.activeBg, color: "#fff" } : undefined}
            onClick={() => onChange(o.value as T)}
            disabled={disabled}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ReviewBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<NameSort>("default");
  const [length, setLength] = useState<LengthRange>(emptyLength);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  /** 발표 여부 — 발표해야 지원자 화면에 결과가 보인다 */
  const [published, setPublished] = useState({ first: false, final: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data: applicants }, { data: settings }] = await Promise.all([
        supabase
          .from("applicants")
          .select("id, student_id, name, track, phone, motivation, applied_at, first_result, interview, final_result")
          .order("applied_at", { ascending: false }),
        supabase.from("recruit_settings").select("first_published, final_published").eq("id", 1).single(),
      ]);
      if (cancelled) return;
      setRows((applicants ?? []) as Applicant[]);
      if (settings) setPublished({ first: settings.first_published, final: settings.final_published });
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const visible = sortRows(
    rows.filter((a) => (!q.trim() || a.name.includes(q.trim())) && inLength(a.motivation, length)),
    sort,
  );
  const firstPending = rows.filter((a) => a.first_result === "대기");
  const finalPending = rows.filter((a) => a.first_result === "합격" && a.final_result === "대기");

  async function setFirst(id: string, v: FirstResult) {
    const patch = v === "합격" ? { first_result: v } : { first_result: v, interview: null, final_result: "대기" as FinalResult };
    const prev = rows;
    setRows((r) => r.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    setPicked((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
    const { error } = await supabase.from("applicants").update(patch).eq("id", id);
    if (error) setRows(prev);
  }

  async function setFinal(id: string, v: FinalResult) {
    const prev = rows;
    setRows((r) => r.map((a) => (a.id === id ? { ...a, final_result: v } : a)));
    const { error } = await supabase.from("applicants").update({ final_result: v }).eq("id", id);
    if (error) setRows(prev);
  }

  async function bulkFirst(v: FirstResult) {
    const ids = [...picked];
    if (ids.length === 0) return;
    const patch = v === "합격" ? { first_result: v } : { first_result: v, interview: null, final_result: "대기" as FinalResult };
    const prev = rows;
    setRows((r) => r.map((a) => (ids.includes(a.id) ? { ...a, ...patch } : a)));
    setPicked(new Set());
    const { error } = await supabase.from("applicants").update(patch).in("id", ids);
    if (error) setRows(prev);
  }

  function toggle(id: string) {
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const PUBLISH_LABEL = { first: "1차", final: "최종" } as const;

  /**
   * 발표를 켜고 끈다.
   *
   * 켜는 순간 지원자 화면에 결과가 그대로 뜨고, 끄면 다시 감춰진다.
   * 어느 쪽이든 되돌리기 어려운 일이라 누르기 전에 한 번 묻는다 —
   * 이미 본 지원자가 있으면 끄더라도 없던 일이 되지는 않는다.
   */
  async function setPublish(key: "first" | "final", next: boolean) {
    const what = PUBLISH_LABEL[key];
    const ask = next
      ? `${what} 결과를 발표할까요?\n\n발표하면 지원자가 바로 자기 결과를 확인할 수 있습니다.`
      : `${what} 결과 발표를 취소할까요?\n\n지원자 화면에서 결과가 다시 감춰집니다. 이미 확인한 지원자에게는 되돌릴 수 없습니다.`;
    if (!window.confirm(ask)) return;

    const prev = published;
    setPublished((p) => ({ ...p, [key]: next }));

    const { error: updateError } = await supabase
      .from("recruit_settings")
      .update(key === "first" ? { first_published: next } : { final_published: next })
      .eq("id", 1);

    // 실패했는데 화면만 바뀌어 있으면 발표된 줄 알고 손을 뗀다
    if (updateError) {
      setPublished(prev);
      window.alert("발표 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  const pendingVisible = visible.filter((a) => a.first_result === "대기");
  const allPicked = pendingVisible.length > 0 && pendingVisible.every((a) => picked.has(a.id));

  return (
    <>
      <Panel
        title="1차 서류 심사"
        count={`대기 ${firstPending.length}명`}
        desc="지원서를 확인하고 합격 여부를 기록합니다. 발표 전까지 지원자에게 공개되지 않습니다."
      >
        <div className={ui.toolbar}>
          <input
            className={ui.search}
            placeholder="이름 검색"
            aria-label="심사 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <LengthFilter value={length} onChange={setLength} />
          <SortSelect value={sort} onChange={setSort} defaultLabel="최근 지원순" />
          <span className={ui.spacer} />
          <button
            type="button"
            className={cn(ui.btn, ui.danger)}
            onClick={() => bulkFirst("불합격")}
            disabled={picked.size === 0}
          >
            선택 일괄 불합격{picked.size > 0 ? ` ${picked.size}` : ""}
          </button>
          <button
            type="button"
            className={cn(ui.btn, ui.primary)}
            onClick={() => bulkFirst("합격")}
            disabled={picked.size === 0}
          >
            선택 일괄 합격{picked.size > 0 ? ` ${picked.size}` : ""}
          </button>
        </div>

        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="대기 지원자 전체 선택"
                    checked={allPicked}
                    onChange={() =>
                      setPicked(allPicked ? new Set() : new Set(pendingVisible.map((a) => a.id)))
                    }
                  />
                </th>
                <th>이름</th>
                <th>학번</th>
                <th>학부 · 트랙</th>
                <th>지원 동기</th>
                <th>1차</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.first_result === "대기" && (
                      <input
                        type="checkbox"
                        aria-label={`${a.name} 선택`}
                        checked={picked.has(a.id)}
                        onChange={() => toggle(a.id)}
                      />
                    )}
                  </td>
                  <td>{a.name}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.student_id}</td>
                  <td className={ui.muted}>{a.track}</td>
                  <td className={cn(ui.muted, ui.clip)}>{a.motivation}</td>
                  <td>
                    <ResultSegmented value={a.first_result} onChange={(v) => setFirst(a.id, v)} />
                  </td>
                </tr>
              ))}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className={ui.muted}>
                    지원자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="최종 심사 · 발표"
        count={`대기 ${finalPending.length}명`}
        desc="면접을 마친 지원자의 최종 결과를 확정하고 발표합니다."
      >
        <div className={ui.toolbar}>
          <span className={ui.spacer} />
          {published.first ? (
            <span className={ui.publishedTag}>1차 결과 발표됨</span>
          ) : null}
          <button
            type="button"
            className={cn(ui.btn, published.first && cn(ui.danger, ui.subtle))}
            onClick={() => setPublish("first", !published.first)}
            disabled={!published.first && firstPending.length > 0}
            title={
              !published.first && firstPending.length > 0 ? "심사가 끝나지 않았습니다" : undefined
            }
          >
            {published.first ? "1차 발표 취소" : "1차 결과 발표"}
          </button>

          {published.final ? (
            <span className={ui.publishedTag}>최종 결과 발표됨</span>
          ) : null}
          <button
            type="button"
            className={cn(ui.btn, published.final ? cn(ui.danger, ui.subtle) : ui.primary)}
            onClick={() => setPublish("final", !published.final)}
            disabled={!published.final && finalPending.length > 0}
            title={
              !published.final && finalPending.length > 0
                ? "최종 심사가 끝나지 않았습니다"
                : undefined
            }
          >
            {published.final ? "최종 발표 취소" : "최종 결과 발표"}
          </button>
        </div>

        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>면접 시간</th>
                <th>1차</th>
                <th>최종</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((a) => a.first_result === "합격")
                .map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td className={cn(ui.numeric, !a.interview && ui.muted)}>
                      {a.interview ?? "미선택"}
                    </td>
                    <td>
                      <Badge tone="green">{a.first_result}</Badge>
                    </td>
                    <td>
                      <ResultSegmented value={a.final_result} onChange={(v) => setFinal(a.id, v)} />
                    </td>
                  </tr>
                ))}
              {rows.filter((a) => a.first_result === "합격").length === 0 && (
                <tr>
                  <td colSpan={4} className={ui.muted}>
                    1차 합격자가 아직 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
