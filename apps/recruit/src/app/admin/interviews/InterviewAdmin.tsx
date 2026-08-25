"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Badge, Panel, ui } from "@/components/admin/Panel";
import { createClient } from "@/lib/supabase/client";
import type { Applicant, SlotRow } from "@/lib/admin-data";

const EMPTY_SLOT = { slot_date: "", time_range: "", interval_label: "30분", capacity: "6" };

export function InterviewAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [people, setPeople] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SLOT);
  const [editing, setEditing] = useState<string | null>(null);
  /** 시간을 고르는 중인 지원자 */
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data: slotData }, { data: peopleData }] = await Promise.all([
        supabase.from("interview_slots").select("*").order("slot_date", { ascending: true }),
        supabase
          .from("applicants")
          .select("id, student_id, name, track, phone, motivation, applied_at, first_result, interview, final_result")
          .order("applied_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setSlots((slotData ?? []) as SlotRow[]);
      setPeople((peopleData ?? []) as Applicant[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const booked = people.filter((a) => a.interview);
  const unbooked = people.filter((a) => a.first_result === "합격" && !a.interview);

  function bookedCount(slotDate: string) {
    return people.filter((a) => a.interview?.startsWith(slotDate)).length;
  }

  async function submitSlot(e: FormEvent) {
    e.preventDefault();
    const capacity = Number(form.capacity) || 0;
    const payload = {
      slot_date: form.slot_date.trim(),
      time_range: form.time_range.trim(),
      interval_label: form.interval_label,
      capacity,
    };

    if (editing) {
      const prev = slots;
      setSlots((s) => s.map((row) => (row.id === editing ? { ...row, ...payload } : row)));
      const { error } = await supabase.from("interview_slots").update(payload).eq("id", editing);
      if (error) setSlots(prev);
    } else {
      const { data, error } = await supabase.from("interview_slots").insert(payload).select().single();
      if (!error && data) setSlots((s) => [...s, data as SlotRow]);
    }
    setForm(EMPTY_SLOT);
    setEditing(null);
    setOpen(false);
  }

  function startEdit(id: string) {
    const s = slots.find((x) => x.id === id);
    if (!s) return;
    setForm({
      slot_date: s.slot_date,
      time_range: s.time_range,
      interval_label: s.interval_label,
      capacity: String(s.capacity),
    });
    setEditing(id);
    setOpen(true);
  }

  async function removeSlot(id: string) {
    const prev = slots;
    setSlots((s) => s.filter((row) => row.id !== id));
    const { error } = await supabase.from("interview_slots").delete().eq("id", id);
    if (error) setSlots(prev);
  }

  /** 지원자에게 면접 시간을 직접 배정한다 */
  async function assign(applicantId: string, interview: string | null) {
    const prev = people;
    setPeople((p) => p.map((a) => (a.id === applicantId ? { ...a, interview } : a)));
    setAssigning(null);
    const { error } = await supabase.from("applicants").update({ interview }).eq("id", applicantId);
    if (error) setPeople(prev);
  }

  return (
    <>
      <Panel
        title="면접 슬롯 관리"
        count={`${slots.length}일`}
        desc="날짜와 시간대를 열어두면 배정 현황을 한눈에 볼 수 있습니다."
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
                value={form.slot_date}
                onChange={(e) => setForm({ ...form, slot_date: e.target.value })}
                placeholder="예: 9.14 (일)"
                required
              />
            </label>
            <label className={ui.inlineField}>
              <span className={ui.inlineLabel}>운영 시간</span>
              <input
                className={ui.inlineInput}
                value={form.time_range}
                onChange={(e) => setForm({ ...form, time_range: e.target.value })}
                placeholder="예: 13:00 – 17:00"
                required
              />
            </label>
            <label className={ui.inlineField}>
              <span className={ui.inlineLabel}>간격</span>
              <select
                className={ui.inlineInput}
                value={form.interval_label}
                onChange={(e) => setForm({ ...form, interval_label: e.target.value })}
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
              <button type="submit" className={cn(ui.btn, ui.primary)} disabled={!form.slot_date.trim()}>
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
                const count = bookedCount(s.slot_date);
                const full = count >= s.capacity;
                return (
                  <tr key={s.id}>
                    <td>{s.slot_date}</td>
                    <td className={cn(ui.muted, ui.numeric)}>{s.time_range}</td>
                    <td className={ui.muted}>{s.interval_label}</td>
                    <td className={ui.numeric}>
                      {count} / {s.capacity}
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
              {!loading && slots.length === 0 && (
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
        desc={`미예약 ${unbooked.length}명 — 운영진이 직접 배정합니다.`}
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
                  <td className={cn(ui.muted, ui.numeric)}>{a.student_id}</td>
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
                          <option key={s.id} value={`${s.slot_date} ${s.time_range.split(" – ")[0]}`}>
                            {s.slot_date} {s.time_range}
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
              {!loading && booked.length === 0 && unbooked.length === 0 && (
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
