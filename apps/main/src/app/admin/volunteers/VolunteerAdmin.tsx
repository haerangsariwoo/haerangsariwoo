"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { volunteerCategories } from "@/lib/mock-data";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./volunteers.module.css";

interface ActivityRow {
  id: string;
  title: string;
  date_label: string;
  time_label: string;
  place: string;
  category: string;
  capacity: number;
  intro: string;
  duties: string[];
  supplies: string[];
  cautions: string[];
  manager: string;
  partner_id: string | null;
  status: "open" | "closed";
  created_at: string;
}

interface PartnerOption {
  id: string;
  name: string;
}

const EMPTY = {
  title: "",
  date_label: "",
  time_label: "",
  place: "",
  category: "환경",
  capacity: "15",
  intro: "",
  duties: "",
  supplies: "",
  cautions: "",
  manager: "",
  partner_id: "",
};

/** 쉼표로 구분해 입력한 걸 배열로 — 내부봉사는 이 리스트를 상세 페이지에 그대로 보여준다 */
function toList(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function VolunteerAdmin() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [applied, setApplied] = useState<Record<string, number>>({});
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data: activities }, { data: apps }, { data: partnerRows }] = await Promise.all([
        supabase.from("internal_activities").select("*").order("created_at", { ascending: false }),
        supabase.from("internal_activity_applications").select("activity_id, state"),
        supabase.from("partners").select("id, name").order("name"),
      ]);
      if (cancelled) return;
      setRows((activities ?? []) as ActivityRow[]);
      setPartners((partnerRows ?? []) as PartnerOption[]);
      const counts: Record<string, number> = {};
      for (const a of apps ?? []) {
        if (a.state !== "불참" && a.state !== "노쇼") {
          counts[a.activity_id] = (counts[a.activity_id] ?? 0) + 1;
        }
      }
      setApplied(counts);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const visible = rows.filter((v) => {
    const hitQ = !q.trim() || v.title.includes(q.trim()) || v.place.includes(q.trim());
    const hitSt = status === "all" || (status === "open" ? v.status === "open" : v.status === "closed");
    return hitQ && hitSt;
  });

  async function create(e: FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      date_label: form.date_label.trim(),
      time_label: form.time_label.trim(),
      place: form.place.trim(),
      category: form.category,
      capacity: Number(form.capacity) || 0,
      intro: form.intro.trim(),
      duties: toList(form.duties),
      supplies: toList(form.supplies),
      cautions: toList(form.cautions),
      manager: form.manager.trim(),
      partner_id: form.partner_id || null,
    };
    const { data, error } = await supabase.from("internal_activities").insert(payload).select().single();
    if (!error && data) {
      setRows((prev) => [data as ActivityRow, ...prev]);
      setForm(EMPTY);
      setOpen(false);
    }
  }

  /** 모집 중 ↔ 모집 마감 */
  async function toggleStatus(id: string, current: "open" | "closed") {
    const next = current === "open" ? "closed" : "open";
    const prev = rows;
    setRows((cur) => cur.map((v) => (v.id === id ? { ...v, status: next } : v)));
    const { error } = await supabase.from("internal_activities").update({ status: next }).eq("id", id);
    if (error) setRows(prev);
  }

  async function remove(id: string) {
    if (!window.confirm("이 봉사활동을 삭제할까요? 신청 내역도 함께 지워지며 되돌릴 수 없습니다.")) return;
    const prev = rows;
    setRows((cur) => cur.filter((v) => v.id !== id));
    const { error } = await supabase.from("internal_activities").delete().eq("id", id);
    if (error) setRows(prev);
  }

  const canSubmit = form.title.trim() && form.date_label.trim() && form.place.trim();

  return (
    <Panel title="봉사활동 목록" count={`${rows.length}건`}>
      <div className={toolbar.toolbar}>
        <input
          className={toolbar.search}
          placeholder="봉사명·장소 검색"
          aria-label="봉사 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={toolbar.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="상태 필터"
        >
          <option value="all">상태: 전체</option>
          <option value="open">모집 중</option>
          <option value="closed">모집 마감</option>
        </select>
        <span className={toolbar.spacer} />
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary)}
          onClick={() => setOpen((o) => !o)}
          disabled={readOnly && !open}
        >
          {open ? "닫기" : "＋ 봉사활동 만들기"}
        </button>
      </div>

      {open && (
        <form className={styles.createForm} onSubmit={create}>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.label}>봉사명</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 성북천 플로깅"
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>날짜</span>
              <input
                className={styles.input}
                value={form.date_label}
                onChange={(e) => setForm({ ...form, date_label: e.target.value })}
                placeholder="예: 9.20 (토)"
                required
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.label}>시간</span>
              <input
                className={styles.input}
                value={form.time_label}
                onChange={(e) => setForm({ ...form, time_label: e.target.value })}
                placeholder="예: 09:00 – 12:00"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>장소</span>
              <input
                className={styles.input}
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                placeholder="예: 성북천 분수마루 앞"
                required
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>정원</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </label>
            <label className={cn(styles.field, styles.narrow)}>
              <span className={styles.label}>분야</span>
              <select
                className={styles.input}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {volunteerCategories
                  .filter((c) => c !== "전체")
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>담당자</span>
              <input
                className={styles.input}
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                placeholder="예: 김우영 운영진"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>협력기관 (선택)</span>
              <select
                className={styles.input}
                value={form.partner_id}
                onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
              >
                <option value="">연결 안 함</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.label}>활동 소개</span>
            <input
              className={styles.input}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
              placeholder="부원들에게 보여줄 소개 문구"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>담당 업무 (쉼표로 구분)</span>
            <input
              className={styles.input}
              value={form.duties}
              onChange={(e) => setForm({ ...form, duties: e.target.value })}
              placeholder="예: 구간별 쓰레기 수거, 분리배출 정리"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>준비물 (쉼표로 구분)</span>
            <input
              className={styles.input}
              value={form.supplies}
              onChange={(e) => setForm({ ...form, supplies: e.target.value })}
              placeholder="예: 편한 운동화, 장갑(현장 제공)"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>주의사항 (쉼표로 구분)</span>
            <input
              className={styles.input}
              value={form.cautions}
              onChange={(e) => setForm({ ...form, cautions: e.target.value })}
              placeholder="예: 우천 시 일정이 변경될 수 있습니다."
            />
          </label>
          <div className={styles.formActions}>
            <button type="submit" className={cn(toolbar.button, toolbar.primary)} disabled={!canSubmit}>
              만들기
            </button>
            <button type="button" className={toolbar.button} onClick={() => setOpen(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      <DataTable columns={["봉사활동", "날짜", "장소", "협력기관", "신청/정원", "분야", "상태", ""]}>
        {visible.map((v) => (
          <tr key={v.id}>
            <td>{v.title}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{v.date_label}</td>
            <td className={tableStyles.muted}>{v.place}</td>
            <td className={tableStyles.muted}>
              {partners.find((p) => p.id === v.partner_id)?.name ?? "—"}
            </td>
            <td className={tableStyles.numeric}>
              {applied[v.id] ?? 0} / {v.capacity}
            </td>
            <td>
              <Badge tone="blue">{v.category}</Badge>
            </td>
            <td>
              <Badge tone={v.status === "closed" ? "grey" : "green"}>
                {v.status === "closed" ? "모집 마감" : "모집 중"}
              </Badge>
            </td>
            <td className={styles.rowActions}>
              <RowAction onClick={() => toggleStatus(v.id, v.status)} disabled={readOnly}>
                {v.status === "closed" ? "재개" : "마감"}
              </RowAction>
              <RowAction onClick={() => remove(v.id)} disabled={readOnly}>
                삭제
              </RowAction>
            </td>
          </tr>
        ))}
        {!loading && visible.length === 0 && (
          <tr>
            <td colSpan={8} className={tableStyles.muted}>
              조건에 맞는 봉사활동이 없습니다.
            </td>
          </tr>
        )}
      </DataTable>
    </Panel>
  );
}
