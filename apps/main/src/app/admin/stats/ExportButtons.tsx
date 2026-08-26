"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { downloadCsv, today } from "@/lib/csv";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./stats.module.css";

interface ProofExportRow {
  activity_title: string;
  activity_org: string;
  activity_date: string;
  hours: number;
  source: string;
  status: string;
  photo_paths: string[];
  member: { name: string; student_id: string } | null;
}

interface MemberExportRow {
  id: string;
  name: string;
  gender: string | null;
  student_id: string;
  birth: string | null;
  cohort: string;
  track: string;
  mbti: string | null;
  role: string;
}

interface ApplicationExportRow {
  applied_at: string;
  state: string;
  members: { name: string; student_id: string; cohort: string } | null;
  internal_activities: { title: string } | null;
}

export function ExportButtons() {
  const supabase = useMemo(() => createClient(), []);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function notify(what: string) {
    setDone(what);
    window.setTimeout(() => setDone(null), 2600);
  }

  /** 승인된 봉사시간은 사람마다 합쳐서도 필요하지만, 감사 자료라 건별로 내보낸다 */
  async function exportHours() {
    setBusy(true);
    const { data } = await supabase
      .from("proof_submissions")
      .select(
        "activity_title, activity_org, activity_date, hours, source, status, photo_paths, member:member_id(name, student_id)",
      )
      .order("activity_date", { ascending: false });
    setBusy(false);

    downloadCsv(
      `봉사시간_${today()}.csv`,
      ["이름", "학번", "봉사활동", "기관", "활동일", "시간", "출처", "증빙", "상태"],
      ((data ?? []) as unknown as ProofExportRow[]).map((h) => [
        h.member?.name ?? "",
        h.member?.student_id ?? "",
        h.activity_title,
        h.activity_org,
        h.activity_date,
        h.hours,
        h.source === "1365" ? "1365" : "VMS",
        `사진 ${h.photo_paths.length}장`,
        h.status,
      ]),
    );
    notify("봉사시간");
  }

  async function exportMembers() {
    setBusy(true);
    const { data } = await supabase
      .from("members")
      .select("id, name, gender, student_id, birth, cohort, track, mbti, role")
      .eq("status", "approved")
      .order("cohort");

    const { data: proofs } = await supabase
      .from("proof_submissions")
      .select("hours, member_id")
      .eq("status", "승인");
    setBusy(false);

    const hoursBy = new Map<string, number>();
    for (const p of (proofs ?? []) as { hours: number; member_id: string }[]) {
      hoursBy.set(p.member_id, (hoursBy.get(p.member_id) ?? 0) + p.hours);
    }

    downloadCsv(
      `회원명단_${today()}.csv`,
      ["이름", "성별", "학번", "생년월일", "기수", "트랙", "MBTI", "권한", "누적시간"],
      ((data ?? []) as MemberExportRow[]).map((m) => [
        m.name,
        m.gender ?? "",
        m.student_id,
        m.birth ?? "",
        m.cohort,
        m.track,
        m.mbti ?? "",
        m.role,
        hoursBy.get(m.id) ?? 0,
      ]),
    );
    notify("회원 명단");
  }

  async function exportAttendance() {
    setBusy(true);
    const { data } = await supabase
      .from("internal_activity_applications")
      .select(
        "applied_at, state, members(name, student_id, cohort), internal_activities(title)",
      )
      .order("applied_at", { ascending: false });
    setBusy(false);

    downloadCsv(
      `출석현황_${today()}.csv`,
      ["이름", "학번", "기수", "신청 봉사", "신청일", "상태"],
      ((data ?? []) as unknown as ApplicationExportRow[]).map((a) => [
        a.members?.name ?? "",
        a.members?.student_id ?? "",
        a.members?.cohort ?? "",
        a.internal_activities?.title ?? "",
        a.applied_at?.slice(0, 10) ?? "",
        a.state,
      ]),
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
          disabled={busy}
          title="스프레드시트에서 열 수 있는 CSV 로 받습니다"
        >
          구글 스프레드시트로 내보내기
        </button>
        <button type="button" className={toolbar.button} onClick={exportHours} disabled={busy}>
          봉사시간 CSV
        </button>
        <button type="button" className={toolbar.button} onClick={exportMembers} disabled={busy}>
          회원 명단 CSV
        </button>
        <button type="button" className={toolbar.button} onClick={exportAttendance} disabled={busy}>
          출석 현황 CSV
        </button>
      </div>
      {done && <p className={styles.exportDone}>{done} 파일을 내려받았습니다.</p>}
    </>
  );
}
