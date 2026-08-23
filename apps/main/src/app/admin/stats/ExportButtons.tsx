"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { adminMembers, hourRequests, applicants } from "@/lib/admin-data";
import { downloadCsv, today } from "@/lib/csv";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./stats.module.css";

export function ExportButtons() {
  const [done, setDone] = useState<string | null>(null);

  function notify(what: string) {
    setDone(what);
    window.setTimeout(() => setDone(null), 2600);
  }

  function exportHours() {
    downloadCsv(
      `봉사시간_${today()}.csv`,
      ["이름", "학번", "봉사활동", "활동일", "시간", "증빙", "상태"],
      hourRequests.map((h) => [h.name, h.studentId, h.volunteer, h.date, h.hours, h.proof, h.state]),
    );
    notify("봉사시간");
  }

  function exportMembers() {
    downloadCsv(
      `회원명단_${today()}.csv`,
      ["이름", "성별", "학번", "생년월일", "기수", "트랙", "MBTI", "권한", "누적시간"],
      adminMembers.map((m) => [
        m.name,
        m.gender,
        m.studentId,
        m.birth,
        m.cohort,
        m.track,
        m.mbti ?? "",
        m.role,
        m.hours,
      ]),
    );
    notify("회원 명단");
  }

  function exportAttendance() {
    downloadCsv(
      `출석현황_${today()}.csv`,
      ["이름", "학번", "기수", "신청 봉사", "신청일", "상태"],
      applicants.map((a) => [a.name, a.studentId, a.cohort, a.volunteer, a.appliedAt, a.state]),
    );
    notify("출석 현황");
  }

  return (
    <>
      <div className={styles.exportRow}>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.sheet)}
          onClick={exportHours}
          title="스프레드시트에서 열 수 있는 CSV 로 받습니다"
        >
          구글 스프레드시트로 내보내기
        </button>
        <button type="button" className={toolbar.button} onClick={exportHours}>
          봉사시간 CSV
        </button>
        <button type="button" className={toolbar.button} onClick={exportMembers}>
          회원 명단 CSV
        </button>
        <button type="button" className={toolbar.button} onClick={exportAttendance}>
          출석 현황 CSV
        </button>
      </div>
      {done && <p className={styles.exportDone}>{done} 파일을 내려받았습니다.</p>}
    </>
  );
}
