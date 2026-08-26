"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import styles from "./interview.module.css";

export interface InterviewSlotOption {
  id: string;
  label: string;
  date: string;
  time: string;
  interval: string;
  left: number;
  capacity: number;
}

/**
 * 1차 합격자가 면접 시간을 고르는 자리.
 * 자리 수는 화면에도 보여주지만 실제 판단은 서버가 한다 — 두 사람이 동시에
 * 마지막 자리를 눌렀을 때 화면만 보고 통과시키면 정원이 넘는다.
 */
export function InterviewPicker({
  studentId,
  code,
  slots,
  current,
  onBooked,
  place,
}: {
  studentId: string;
  code: string;
  slots: InterviewSlotOption[];
  current: string | null;
  onBooked: (label: string, slots: InterviewSlotOption[]) => void;
  place: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function book() {
    if (!picked) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/apply/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, code, slotId: picked }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "저장 중 문제가 발생했습니다.");
      // 자리가 찬 경우라면 남은 자리를 다시 받아와 화면을 맞춘다
      const refresh = await fetch("/api/apply/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, code }),
      });
      if (refresh.ok) {
        const fresh = await refresh.json();
        onBooked(current ?? "", fresh.slots);
      }
      setBusy(false);
      setPicked(null);
      return;
    }

    setBusy(false);
    onBooked(data.interview, slots);
  }

  if (current) {
    return (
      <div className={styles.booked}>
        <p className={styles.bookedLabel}>선택한 면접 시간</p>
        <p className={styles.bookedValue}>{current}</p>
        <p className={styles.bookedPlace}>{place}</p>
        <button type="button" className={styles.changeLink} onClick={() => onBooked("", slots)}>
          시간 바꾸기
        </button>
      </div>
    );
  }

  const open = slots.filter((s) => s.left > 0);

  return (
    <div className={styles.picker}>
      <h2 className={styles.pickerTitle}>면접 시간을 골라주세요</h2>
      {slots.length === 0 ? (
        <p className={styles.empty}>
          아직 열린 시간대가 없어요. 운영진이 일정을 올리면 여기에서 고를 수 있어요.
        </p>
      ) : open.length === 0 ? (
        <p className={styles.empty}>모든 시간대가 찼어요. 운영진에게 문의해 주세요.</p>
      ) : (
        <>
          <div className={styles.slotList}>
            {slots.map((s) => {
              const full = s.left === 0;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={full || busy}
                  aria-pressed={picked === s.id}
                  className={cn(styles.slot, picked === s.id && styles.on, full && styles.full)}
                  onClick={() => setPicked(s.id)}
                >
                  <span className={styles.slotDate}>{s.date}</span>
                  <span className={styles.slotTime}>{s.time}</span>
                  <span className={styles.slotLeft}>
                    {full ? "마감" : `${s.left}자리 남음`}
                  </span>
                </button>
              );
            })}
          </div>

          <p className={styles.placeNote}>{place}</p>
          {error && <p className={styles.error}>{error}</p>}

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!picked || busy}
            onClick={book}
          >
            {busy ? "저장 중..." : "이 시간으로 예약"}
          </Button>
        </>
      )}
    </div>
  );
}
