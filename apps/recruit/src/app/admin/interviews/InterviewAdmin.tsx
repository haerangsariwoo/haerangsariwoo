"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { applicants as applicantSeed, slotRows as slotSeed } from "@/lib/admin-data";

const EMPTY_SLOT = { date: "", range: "", interval: "30분", capacity: "6" };

export function InterviewAdmin() {
  const [slots, setSlots] = useState(slotSeed);
  const [people, setPeople] = useState(applicantSeed);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SLOT);
  const [editing, setEditing] = useState<string | null>(null);
  /** 시간을 고르는 중인 지원자 */
  const [assigning, setAssigning] = useState<string | null>(null);

  const booked = people.filter((a) => a.interview);
  const unbooked = people.filter((a) => a.first === "합격" && !a.interview);

  function submitSlot(e: FormEvent) {
    e.preventDefault();
    const cap = Number(form.capacity) || 0;
    if (editing) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === editing
            ? { ...s, date: form.date, range: form.range, interval: form.interval, capacity: cap }
            : s,
        ),
      );
    } else {
      setSlots((prev) => [
        ...prev,
        {
          id: `sr${Date.now()}`,
          date: form.date.trim(),
          range: form.range.trim(),
          interval: form.interval,
          booked: 0,
          capacity: cap,
        },
      ]);
    }
    setForm(EMPTY_SLOT);
    setEditing(null);
    setOpen(false);
  }

  function startEdit(id: string) {
    const s = slots.find((x) => x.id === id);
    if (!s) return;
    setForm({
      date: s.date,
      range: s.range,
      interval: s.interval,
      capacity: String(s.capacity),
    });
    setEditing(id);
    setOpen(true);
  }

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  /** 지원자에게 면접 시간을 직접 배정한다 */
  function assign(applicantId: string, slotDate: string | null) {
    setPeople((prev) =>
      prev.map((a) => (a.id === applicantId ? { ...a, interview: slotDate } : a)),
    );
    setAssigning(null);
  }

  return (
    <>
      <Panel
        title="면접 슬롯 관리"
        count={`${slots.length}일`}
        desc="날짜와 시간대를 열어두면 1차 합격자가 직접 예약합니다."
      >
        <div className={ui.toolbar}>
          <span className={ui.spacer} />
          <button
            type="button"
            className={cn(ui.btn, ui.primary)}
            onClick={() => {
              setEditing(null);
              setForm(EMPTY_SLOT);
              setOpen((o) => !o);
            }}
          >
            {open && !editing ? "닫기" : "＋ 슬롯 추가"}
          </button>
        </div>

        {open && (
          <form className={ui.inlineForm} onSubmit={submitSlot}>
            <label className={ui.inlineField}>
              <span className={ui.inlineLabel}>날짜</span>
              <input
                className={ui.inlineInput}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="예: 9.14 (일)"
                required
              />
            </label>
            <label className={ui.inlineField}>
              <span className={ui.inlineLabel}>운영 시간</span>
              <input
                className={ui.inlineInput}
                value={form.range}
                onChange={(e) => setForm({ ...form, range: e.target.value })}
                placeholder="예: 13:00 – 17:00"
                required
              />
            </label>
            <label className={ui.inlineField}>
              <span className={ui.inlineLabel}>간격</span>
              <select
                className={ui.inlineInput}
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
              >
                <option value="20분">20분</option>
                <option value="30분">30분</option>
                <option value="40분">40분</option>
              </select>
            </label>
            <label className={ui.inlineField}>
              <span className={ui.inlineLabel}>정원</span>
              <input
                className={ui.inlineInput}
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </label>
            <div className={ui.inlineActions}>
              <button type="submit" className={cn(ui.btn, ui.primary)} disabled={!form.date.trim()}>
                {editing ? "수정 저장" : "추가"}
              </button>
              <button
                type="button"
                className={ui.btn}
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                }}
              >
                취소
              </button>
            </div>
          </form>
        )}

        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>운영 시간</th>
                <th>간격</th>
                <th>예약 / 정원</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => {
                const full = s.booked >= s.capacity;
                return (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td className={cn(ui.muted, ui.numeric)}>{s.range}</td>
                    <td className={ui.muted}>{s.interval}</td>
                    <td className={ui.numeric}>
                      {s.booked} / {s.capacity}
                    </td>
                    <td>
                      <Badge tone={full ? "danger" : "green"}>{full ? "마감" : "예약 가능"}</Badge>
                    </td>
                    <td className={ui.rowActions}>
                      <button type="button" className={ui.rowBtn} onClick={() => startEdit(s.id)}>
                        수정
                      </button>
                      <button type="button" className={ui.rowBtn} onClick={() => removeSlot(s.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
              {slots.length === 0 && (
                <tr>
                  <td colSpan={6} className={ui.muted}>
                    열어둔 면접 슬롯이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="예약 현황"
        count={`${booked.length}명 예약`}
        desc={`미예약 ${unbooked.length}명 — 필요 시 운영진이 직접 배정할 수 있습니다.`}
      >
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>학번</th>
                <th>연락처</th>
                <th>면접 시간</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...booked, ...unbooked].map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.studentId}</td>
                  <td className={cn(ui.muted, ui.numeric)}>{a.phone}</td>
                  <td className={ui.numeric}>
                    {assigning === a.id ? (
                      <select
                        className={ui.inlineInput}
                        autoFocus
                        defaultValue=""
                        onChange={(e) => assign(a.id, e.target.value || null)}
                        aria-label={`${a.name} 면접 시간 선택`}
                      >
                        <option value="">시간 선택</option>
                        {slots.map((s) => (
                          <option key={s.id} value={`${s.date} ${s.range.split(" – ")[0]}`}>
                            {s.date} {s.range}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (a.interview ?? <Badge tone="warn">미선택</Badge>)
                    )}
                  </td>
                  <td className={ui.rowActions}>
                    <button
                      type="button"
                      className={ui.rowBtn}
                      onClick={() => setAssigning((x) => (x === a.id ? null : a.id))}
                    >
                      {a.interview ? "재배정" : "배정"}
                    </button>
                    {a.interview && (
                      <button type="button" className={ui.rowBtn} onClick={() => assign(a.id, null)}>
                        해제
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
