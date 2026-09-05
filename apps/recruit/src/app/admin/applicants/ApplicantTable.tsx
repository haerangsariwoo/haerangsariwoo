"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { MotivationCell, MotivationRow } from "@/components/admin/Motivation";
import { GENDER_KEY, labelOf } from "@/lib/extra-answers";
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
import { downloadCsv, today } from "@/lib/csv";

const FIRST_CYCLE: FirstResult[] = ["대기", "합격", "불합격"];
const FINAL_CYCLE: FinalResult[] = ["대기", "합격", "불합격"];

export function ApplicantTable() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [first, setFirst] = useState("all");
  const [track, setTrack] = useState("all");
  const [gender, setGender] = useState("all");
  const [sort, setSort] = useState<NameSort>("default");
  const [length, setLength] = useState<LengthRange>(emptyLength);
  /** 펼쳐서 지원 동기 전체를 보고 있는 사람 */
  const [openId, setOpenId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("applicants")
        .select("id, student_id, name, track, phone, motivation, applied_at, first_result, interview, final_result, extra")
        .order("applied_at", { ascending: false });
      if (!cancelled) {
        setRows((data ?? []) as Applicant[]);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const tracks = useMemo(() => [...new Set(rows.map((a) => a.track.split(" · ")[0]))], [rows]);

  /*
   * 선택지는 실제 답에서 뽑는다. 문항 설정을 고쳐 다른 값을 받게 되어도
   * 목록이 저절로 따라오고, 아무도 안 고른 값이 걸리지도 않는다.
   */
  const genders = useMemo(
    () => [...new Set(rows.map((a) => a.extra?.[GENDER_KEY]).filter(Boolean) as string[])],
    [rows],
  );

  const visible = sortRows(
    rows.filter((a) => {
      const hitQ = !q.trim() || a.name.includes(q.trim()) || a.student_id.includes(q.trim());
      const hitF = first === "all" || a.first_result === first;
      const hitT = track === "all" || a.track.startsWith(track);
      const hitG = gender === "all" || a.extra?.[GENDER_KEY] === gender;
      return hitQ && hitF && hitT && hitG && inLength(a.motivation, length);
    }),
    sort,
  );

  /** 결과 배지를 눌러 대기 → 합격 → 불합격 순으로 바꾼다 */
  async function cycleFirst(id: string) {
    const current = rows.find((a) => a.id === id);
    if (!current) return;
    const next = FIRST_CYCLE[(FIRST_CYCLE.indexOf(current.first_result) + 1) % FIRST_CYCLE.length];
    // 1차에서 떨어지면 면접과 최종 결과도 함께 정리한다
    const patch = next === "합격" ? { first_result: next } : { first_result: next, interview: null, final_result: "대기" as FinalResult };

    const prev = rows;
    setRows((r) => r.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    const { error } = await supabase.from("applicants").update(patch).eq("id", id);
    if (error) setRows(prev);
  }

  async function cycleFinal(id: string) {
    const current = rows.find((a) => a.id === id);
    if (!current) return;
    const next = FINAL_CYCLE[(FINAL_CYCLE.indexOf(current.final_result) + 1) % FINAL_CYCLE.length];

    const prev = rows;
    setRows((r) => r.map((a) => (a.id === id ? { ...a, final_result: next } : a)));
    const { error } = await supabase.from("applicants").update({ final_result: next }).eq("id", id);
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

  async function deletePicked() {
    const ids = [...picked];
    if (ids.length === 0) return;
    if (!window.confirm(`선택한 지원자 ${ids.length}명을 삭제할까요? 되돌릴 수 없습니다.`)) return;

    const prev = rows;
    setRows((r) => r.filter((a) => !ids.includes(a.id)));
    setPicked(new Set());
    const { error } = await supabase.from("applicants").delete().in("id", ids);
    if (error) setRows(prev);
  }

  function exportCsv() {
    downloadCsv(
      `지원자명단_${today()}.csv`,
      ["이름", labelOf(GENDER_KEY), "학번", "학부·트랙", "연락처", "지원일", "1차", "면접 시간", "최종", "지원 동기"],
      visible.map((a) => [
        a.name,
        a.extra?.[GENDER_KEY] ?? "",
        a.student_id,
        a.track,
        a.phone,
        a.applied_at,
        a.first_result,
        a.interview ?? "",
        a.final_result,
        a.motivation,
      ]),
    );
  }

  return (
    <Panel
      title="지원자 명단"
      count={`${rows.length}명`}
      desc="배지를 눌러 심사 결과를 바꿉니다. 명단은 CSV 로 내보낼 수 있습니다."
    >
      <div className={ui.toolbar}>
        <input
          className={ui.search}
          placeholder="이름 · 학번 검색"
          aria-label="지원자 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={ui.select}
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          aria-label="1차 결과 필터"
        >
          <option value="all">1차: 전체</option>
          <option value="합격">합격</option>
          <option value="대기">대기</option>
          <option value="불합격">불합격</option>
        </select>
        <select
          className={ui.select}
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          aria-label="학부 필터"
        >
          <option value="all">학부: 전체</option>
          {tracks.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {genders.length > 0 && (
          <select
            className={ui.select}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            aria-label={`${labelOf(GENDER_KEY)} 필터`}
          >
            <option value="all">{labelOf(GENDER_KEY)}: 전체</option>
            {genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
        <LengthFilter value={length} onChange={setLength} />
        <SortSelect value={sort} onChange={setSort} defaultLabel="최근 지원순" />
        <span className={ui.spacer} />
        <button
          type="button"
          className={cn(ui.btn, ui.danger)}
          onClick={deletePicked}
          disabled={picked.size === 0}
        >
          선택 삭제{picked.size > 0 ? ` ${picked.size}` : ""}
        </button>
        <button type="button" className={cn(ui.btn, ui.sheet)} onClick={exportCsv}>
          구글 스프레드시트로 내보내기
        </button>
        <button type="button" className={ui.btn} onClick={exportCsv}>
          CSV 다운로드
        </button>
      </div>

      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="지원자 전체 선택"
                  checked={visible.length > 0 && visible.every((a) => picked.has(a.id))}
                  onChange={() =>
                    setPicked((p) =>
                      visible.every((a) => p.has(a.id)) ? new Set() : new Set(visible.map((a) => a.id)),
                    )
                  }
                />
              </th>
              <th>이름</th>
              <th>{labelOf(GENDER_KEY)}</th>
              <th>학번</th>
              <th>학부 · 트랙</th>
              <th>연락처</th>
              <th>지원 동기</th>
              <th>1차</th>
              <th>면접 시간</th>
              <th>최종</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <Fragment key={a.id}>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${a.name} 선택`}
                    checked={picked.has(a.id)}
                    onChange={() => toggle(a.id)}
                  />
                </td>
                <td>{a.name}</td>
                {/* 성별은 표에 자기 칸이 없어 extra 에 들어온다 */}
                <td className={ui.muted}>{a.extra?.[GENDER_KEY] ?? "—"}</td>
                <td className={cn(ui.muted, ui.numeric)}>{a.student_id}</td>
                <td className={ui.muted}>{a.track}</td>
                <td className={cn(ui.muted, ui.numeric)}>{a.phone}</td>
                {/*
                  펼쳐 보는 단추는 지원 동기 옆에 둔다. 맨 끝 칸에 두면
                  1차·최종 결과를 바꾸는 단추들과 나란히 서서, 심사하러
                  누르는 것인지 읽으러 누르는 것인지 헷갈린다.
                */}
                <td>
                  <MotivationCell
                    text={a.motivation}
                    open={openId === a.id}
                    onToggle={() => setOpenId((o) => (o === a.id ? null : a.id))}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={ui.badgeButton}
                    onClick={() => cycleFirst(a.id)}
                    title="눌러서 1차 결과 변경"
                  >
                    <Badge
                      tone={a.first_result === "합격" ? "green" : a.first_result === "불합격" ? "danger" : "grey"}
                    >
                      {a.first_result}
                    </Badge>
                  </button>
                </td>
                <td className={cn(ui.numeric, !a.interview && ui.muted)}>
                  {a.interview ?? (a.first_result === "합격" ? "미선택" : "—")}
                </td>
                <td>
                  <button
                    type="button"
                    className={ui.badgeButton}
                    onClick={() => cycleFinal(a.id)}
                    title="눌러서 최종 결과 변경"
                  >
                    <Badge
                      tone={a.final_result === "합격" ? "green" : a.final_result === "불합격" ? "danger" : "grey"}
                    >
                      {a.final_result}
                    </Badge>
                  </button>
                </td>
              </tr>
              {openId === a.id && (
                <MotivationRow
                  colSpan={10}
                  text={a.motivation}
                  meta={`${a.name} · ${a.student_id} · ${a.track} · ${a.phone}`}
                    extra={a.extra}
                />
              )}
              </Fragment>
            ))}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={10} className={ui.muted}>
                  조건에 맞는 지원자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
