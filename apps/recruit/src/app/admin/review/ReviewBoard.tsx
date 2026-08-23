"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { applicants as seed, type FinalResult, type FirstResult } from "@/lib/admin-data";

export function ReviewBoard() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  /** 발표 여부 — 발표해야 지원자 화면에 결과가 보인다 */
  const [published, setPublished] = useState({ first: false, final: false });

  const visible = rows.filter((a) => !q.trim() || a.name.includes(q.trim()));
  const firstPending = rows.filter((a) => a.first === "대기");
  const finalPending = rows.filter((a) => a.first === "합격" && a.final === "대기");

  function setFirst(id: string, v: FirstResult) {
    setRows((prev) =>
      prev.map((a) =>
        a.id === id
          ? v === "합격"
            ? { ...a, first: v }
            : { ...a, first: v, interview: null, final: "대기" as FinalResult }
          : a,
      ),
    );
    setPicked((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
  }

  function setFinal(id: string, v: FinalResult) {
    setRows((prev) => prev.map((a) => (a.id === id ? { ...a, final: v } : a)));
  }

  function bulkFirst(v: FirstResult) {
    setRows((prev) =>
      prev.map((a) =>
        picked.has(a.id)
          ? v === "합격"
            ? { ...a, first: v }
            : { ...a, first: v, interview: null, final: "대기" as FinalResult }
          : a,
      ),
    );
    setPicked(new Set());
  }

  function toggle(id: string) {
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const pendingVisible = visible.filter((a) => a.first === "대기");
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
          <span className={ui.spacer} />
          <button
            type="button"
            className={ui.btn}
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
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.first === "대기" && (
                      <input
                        type="checkbox"
                        aria-label={`${a.name} 선택`}
                        checked={picked.has(a.id)}
                        onChange={() => toggle(a.id)}
                      />
                    )}
                  </td>
                  <td>{a.name}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.studentId}</td>
                  <td className={ui.muted}>{a.track}</td>
                  <td className={cn(ui.muted, ui.clip)}>{a.motivation}</td>
                  <td>
                    <Badge
                      tone={a.first === "합격" ? "green" : a.first === "불합격" ? "danger" : "grey"}
                    >
                      {a.first}
                    </Badge>
                  </td>
                  <td className={ui.rowActions}>
                    {a.first === "대기" ? (
                      <>
                        <button
                          type="button"
                          className={cn(ui.rowBtn, ui.rowBtnPrimary)}
                          onClick={() => setFirst(a.id, "합격")}
                        >
                          합격
                        </button>
                        <button
                          type="button"
                          className={ui.rowBtn}
                          onClick={() => setFirst(a.id, "불합격")}
                        >
                          불합격
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={ui.rowBtn}
                        onClick={() => setFirst(a.id, "대기")}
                      >
                        되돌리기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
          <button
            type="button"
            className={ui.btn}
            onClick={() => setPublished((p) => ({ ...p, first: true }))}
            disabled={published.first || firstPending.length > 0}
            title={firstPending.length > 0 ? "심사가 끝나지 않았습니다" : undefined}
          >
            {published.first ? "1차 결과 발표됨" : "1차 결과 발표"}
          </button>
          <button
            type="button"
            className={cn(ui.btn, ui.primary)}
            onClick={() => setPublished((p) => ({ ...p, final: true }))}
            disabled={published.final || finalPending.length > 0}
            title={finalPending.length > 0 ? "최종 심사가 끝나지 않았습니다" : undefined}
          >
            {published.final ? "최종 결과 발표됨" : "최종 결과 발표"}
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
                <th />
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((a) => a.first === "합격")
                .map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td className={cn(ui.numeric, !a.interview && ui.muted)}>
                      {a.interview ?? "미선택"}
                    </td>
                    <td>
                      <Badge tone="green">{a.first}</Badge>
                    </td>
                    <td>
                      <Badge
                        tone={
                          a.final === "합격" ? "green" : a.final === "불합격" ? "danger" : "grey"
                        }
                      >
                        {a.final}
                      </Badge>
                    </td>
                    <td className={ui.rowActions}>
                      {a.final === "대기" ? (
                        <>
                          <button
                            type="button"
                            className={cn(ui.rowBtn, ui.rowBtnPrimary)}
                            onClick={() => setFinal(a.id, "합격")}
                          >
                            합격
                          </button>
                          <button
                            type="button"
                            className={ui.rowBtn}
                            onClick={() => setFinal(a.id, "불합격")}
                          >
                            불합격
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={ui.rowBtn}
                          onClick={() => setFinal(a.id, "대기")}
                        >
                          되돌리기
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              {rows.filter((a) => a.first === "합격").length === 0 && (
                <tr>
                  <td colSpan={5} className={ui.muted}>
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
