"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge, ui } from "@/components/admin/Panel";
import { applicants as seed, type FinalResult, type FirstResult } from "@/lib/admin-data";
import { downloadCsv, today } from "@/lib/csv";

const FIRST_CYCLE: FirstResult[] = ["대기", "합격", "불합격"];
const FINAL_CYCLE: FinalResult[] = ["대기", "합격", "불합격"];

export function ApplicantTable() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [first, setFirst] = useState("all");
  const [track, setTrack] = useState("all");
  /** 펼쳐서 지원 동기 전체를 보고 있는 사람 */
  const [openId, setOpenId] = useState<string | null>(null);

  const tracks = useMemo(() => [...new Set(seed.map((a) => a.track.split(" · ")[0]))], []);

  const visible = rows.filter((a) => {
    const hitQ = !q.trim() || a.name.includes(q.trim()) || a.studentId.includes(q.trim());
    const hitF = first === "all" || a.first === first;
    const hitT = track === "all" || a.track.startsWith(track);
    return hitQ && hitF && hitT;
  });

  /** 결과 배지를 눌러 대기 → 합격 → 불합격 순으로 바꾼다 */
  function cycleFirst(id: string) {
    setRows((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = FIRST_CYCLE[(FIRST_CYCLE.indexOf(a.first) + 1) % FIRST_CYCLE.length];
        // 1차에서 떨어지면 면접과 최종 결과도 함께 정리한다
        return next === "합격"
          ? { ...a, first: next }
          : { ...a, first: next, interview: null, final: "대기" };
      }),
    );
  }

  function cycleFinal(id: string) {
    setRows((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, final: FINAL_CYCLE[(FINAL_CYCLE.indexOf(a.final) + 1) % FINAL_CYCLE.length] }
          : a,
      ),
    );
  }

  function exportCsv() {
    downloadCsv(
      `지원자명단_${today()}.csv`,
      ["이름", "학번", "학부·트랙", "연락처", "지원일", "1차", "면접 시간", "최종", "지원 동기"],
      visible.map((a) => [
        a.name,
        a.studentId,
        a.track,
        a.phone,
        a.appliedAt,
        a.first,
        a.interview ?? "",
        a.final,
        a.motivation,
      ]),
    );
  }

  return (
    <>
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
        <span className={ui.spacer} />
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
              <th>이름</th>
              <th>학번</th>
              <th>학부 · 트랙</th>
              <th>연락처</th>
              <th>지원 동기</th>
              <th>1차</th>
              <th>면접 시간</th>
              <th>최종</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className={cn(ui.muted, ui.numeric)}>{a.studentId}</td>
                <td className={ui.muted}>{a.track}</td>
                <td className={cn(ui.muted, ui.numeric)}>{a.phone}</td>
                <td className={cn(ui.muted, openId !== a.id && ui.clip)}>{a.motivation}</td>
                <td>
                  <button
                    type="button"
                    className={ui.badgeButton}
                    onClick={() => cycleFirst(a.id)}
                    title="눌러서 1차 결과 변경"
                  >
                    <Badge
                      tone={a.first === "합격" ? "green" : a.first === "불합격" ? "danger" : "grey"}
                    >
                      {a.first}
                    </Badge>
                  </button>
                </td>
                <td className={cn(ui.numeric, !a.interview && ui.muted)}>
                  {a.interview ?? (a.first === "합격" ? "미선택" : "—")}
                </td>
                <td>
                  <button
                    type="button"
                    className={ui.badgeButton}
                    onClick={() => cycleFinal(a.id)}
                    title="눌러서 최종 결과 변경"
                  >
                    <Badge
                      tone={a.final === "합격" ? "green" : a.final === "불합격" ? "danger" : "grey"}
                    >
                      {a.final}
                    </Badge>
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={ui.rowBtn}
                    onClick={() => setOpenId((o) => (o === a.id ? null : a.id))}
                  >
                    {openId === a.id ? "접기" : "보기"}
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className={ui.muted}>
                  조건에 맞는 지원자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
