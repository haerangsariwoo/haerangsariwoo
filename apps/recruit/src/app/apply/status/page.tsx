"use client";

import { useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";
import { Shell } from "@/components/layout/Shell/Shell";
import { Button } from "@/components/ui/Button/Button";
import {
  cohortLabel,
  interviewPlace,
  interviewSlots,
  nextSteps,
  recruitConfig,
} from "@/lib/recruit-config";
import styles from "./status.module.css";

/** 데모용 상태 전환 — 실제로는 지원자의 심사 상태를 서버에서 내려준다 */
type Stage = "submitted" | "firstPass" | "firstFail" | "finalPass" | "finalFail";

const STAGES: { key: Stage; label: string }[] = [
  { key: "submitted", label: "제출 완료" },
  { key: "firstPass", label: "1차 결과" },
  { key: "finalPass", label: "최종 결과" },
];

const CheckIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export default function StatusPage() {
  const [stage, setStage] = useState<Stage>("submitted");
  const [reject, setReject] = useState(false);
  const [selectedDate, setSelectedDate] = useState(interviewSlots[0].date);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const dates = useMemo(() => [...new Set(interviewSlots.map((s) => s.date))], []);
  const slots = interviewSlots.filter((s) => s.date === selectedDate);

  const showStage: Stage =
    stage === "firstPass" && reject
      ? "firstFail"
      : stage === "finalPass" && reject
        ? "finalFail"
        : stage;

  return (
    <Shell title="지원 현황" back="/">
      {/* 데모 전환 스위처 — Supabase 연동 시 제거 */}
      <Tabs.Root value={stage} onValueChange={(v) => setStage(v as Stage)}>
        <Tabs.List className={styles.switcher} aria-label="지원 단계 보기">
          {STAGES.map((s) => (
            <Tabs.Trigger key={s.key} value={s.key} className={styles.switchBtn}>
              {s.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>
      {stage !== "submitted" && (
        <label className={styles.demoNote}>
          <input
            type="checkbox"
            checked={reject}
            onChange={(e) => setReject(e.target.checked)}
          />{" "}
          불합격 화면으로 보기 (데모)
        </label>
      )}

      {showStage === "submitted" && (
        <>
          <div className={styles.successIcon}>
            <CheckIcon size={34} />
          </div>
          <h1 className={styles.centerTitle}>지원서가 제출됐어요!</h1>

          <div className={styles.timeline}>
            <p className={styles.timelineTitle}>
              {recruitConfig.semester} {cohortLabel(recruitConfig.year, recruitConfig.semesterNo)} 신입부원 모집
            </p>
            {[
              { label: "지원서 제출", done: true },
              { label: "1차 심사", done: false },
              { label: "면접 일정 선택", done: false },
              { label: "최종 발표", done: false },
            ].map((s, i) => (
              <div key={s.label} className={styles.stepRow}>
                <span className={cn(styles.stepIcon, s.done && styles.done)}>
                  {s.done ? <CheckIcon size={14} /> : i + 1}
                </span>
                <span className={styles.stepLabel}>{s.label}</span>
                <span className={cn(styles.stepState, s.done && styles.done)}>
                  {s.done ? "완료" : "대기"}
                </span>
              </div>
            ))}
          </div>

          <p className={styles.infoNote}>
            결과 발표 후 동일한 <b>학번과 본인 지정번호</b>로 로그인하면 결과를 확인할 수 있어요.
            1차 발표는 <b>{recruitConfig.firstResultDate}</b> 예정입니다.
          </p>
        </>
      )}

      {showStage === "firstPass" && (
        <>
          <div className={styles.resultCard}>
            <span className={styles.resultLabel}>1차 합격</span>
            <h1 className={styles.resultTitle}>면접에서 만나요!</h1>
            <p className={styles.resultDesc}>희망하는 면접 시간을 선택해 주세요.</p>
          </div>

          <p className={styles.sectionTitle}>면접 날짜</p>
          <Tabs.Root
            value={selectedDate}
            onValueChange={(v) => {
              setSelectedDate(v);
              setSelectedSlot(null);
            }}
          >
            <Tabs.List className={styles.dateTabs} aria-label="면접 날짜">
              {dates.map((d) => (
                <Tabs.Trigger key={d} value={d} className={styles.dateTab}>
                  {d}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>

          <p className={styles.sectionTitle}>시간 선택</p>
          <div className={styles.slotGrid}>
            {slots.map((s) => {
              const left = s.capacity - s.taken;
              const full = left <= 0;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={full}
                  className={cn(styles.slot, selectedSlot === s.id && styles.selected)}
                  onClick={() => setSelectedSlot(s.id)}
                >
                  <span className={styles.slotTime}>{s.time}</span>
                  <span className={styles.slotLeft}>
                    {full ? "마감" : `${left}/${s.capacity}`}
                  </span>
                </button>
              );
            })}
          </div>

          <p className={styles.placeNote}>
            <span aria-hidden>📍</span>
            {interviewPlace}
          </p>

          <div className={styles.footerAction}>
            <Button variant="primary" size="lg" fullWidth disabled={!selectedSlot}>
              {selectedSlot ? "면접 시간 예약" : "시간을 선택해 주세요"}
            </Button>
          </div>
        </>
      )}

      {showStage === "firstFail" && (
        <>
          <div className={cn(styles.resultCard, styles.reject)}>
            <span className={styles.resultLabel}>1차 결과 안내</span>
            <h1 className={styles.resultTitle}>
              소중한 지원에
              <br />
              진심으로 감사드립니다
            </h1>
            <p className={styles.resultDesc}>
              아쉽게도 이번 모집에서는 함께하지 못하게 되었습니다.
              <br />
              보내주신 관심에 다시 한번 감사드립니다.
            </p>
          </div>

          <p className={styles.infoNote}>
            제출해 주신 개인정보는 모집 종료 후 관련 법령에 따라 안전하게 파기됩니다.
          </p>

          <div className={styles.footerAction}>
            <Button variant="outline" size="lg" fullWidth>
              확인했어요
            </Button>
          </div>
        </>
      )}

      {showStage === "finalPass" && (
        <>
          <div className={styles.resultCard}>
            <span className={styles.resultEmblem}>
              <CheckIcon />
            </span>
            <span className={styles.resultLabel}>최종 합격</span>
            <h1 className={styles.resultTitle}>
              해랑사리우의 새 가족이
              <br />
              되어주셔서 감사합니다!
            </h1>
            <p className={styles.resultDesc}>다음 안내는 공식 채널을 통해 전달됩니다.</p>
          </div>

          <div className={styles.nextCard}>
            <p className={styles.nextTitle}>다음 단계</p>
            <ul className={styles.nextList}>
              {nextSteps.map((s, i) => (
                <li key={s} className={styles.nextItem}>
                  <span className={styles.nextNo}>{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <p className={styles.infoNote}>
            개인 연락처 대신 <b>공식 문의 채널</b>을 이용해 주세요.
          </p>

          <div className={styles.footerAction}>
            <Button variant="primary" size="lg" fullWidth>
              메인 회원 앱 안내 보기
            </Button>
          </div>
        </>
      )}

      {showStage === "finalFail" && (
        <>
          <div className={cn(styles.resultCard, styles.reject)}>
            <span className={styles.resultLabel}>최종 결과 안내</span>
            <h1 className={styles.resultTitle}>
              함께해 주셔서
              <br />
              진심으로 감사했습니다
            </h1>
            <p className={styles.resultDesc}>
              아쉽게도 이번 모집에서는 함께하지 못하게 되었습니다.
              <br />
              면접까지 함께해 주셔서 감사합니다.
            </p>
          </div>

          <p className={styles.infoNote}>
            제출해 주신 개인정보와 면접 기록은 모집 종료 후 관련 법령에 따라 안전하게 파기됩니다.
          </p>

          <div className={styles.footerAction}>
            <Button variant="outline" size="lg" fullWidth>
              확인했어요
            </Button>
          </div>
        </>
      )}
    </Shell>
  );
}
