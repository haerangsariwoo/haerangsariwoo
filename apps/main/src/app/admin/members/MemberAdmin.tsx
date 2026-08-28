"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

type Role = "부원" | "운영진" | "관리자";
type Status = "pending" | "approved" | "rejected";

interface MemberRow {
  id: string;
  student_id: string;
  name: string;
  gender: string | null;
  birth: string | null;
  cohort: string;
  track: string;
  mbti: string | null;
  role: Role;
  status: Status;
  created_at: string;
}

const STATUS_LABEL: Record<Status, "대기" | "승인" | "반려"> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

const STATUS_TONE: Record<Status, "orange" | "green" | "grey"> = {
  pending: "orange",
  approved: "green",
  rejected: "grey",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function MemberAdmin() {
  const { readOnly } = useSemester();
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** 회원 삭제 버튼은 관리자한테만 보인다 — 실제 권한은 서버에서도 다시 확인한다 */
  const [isSelfAdmin, setIsSelfAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error: fetchError }, { data: authData }] = await Promise.all([
        supabase.from("members").select("*").order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (fetchError) {
        setError("회원 정보를 불러오지 못했습니다.");
      } else {
        setRows((data ?? []) as MemberRow[]);
        const me = (data ?? []).find((r) => r.id === authData.user?.id);
        setIsSelfAdmin(me?.role === "관리자");
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // ---------- 가입 승인 대기 ----------
  const [reqQ, setReqQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const visibleReq = rows.filter(
    (r) => !reqQ.trim() || r.name.includes(reqQ.trim()) || r.student_id.includes(reqQ.trim()),
  );
  const pending = rows.filter((r) => r.status === "pending");
  const pendingVisible = visibleReq.filter((r) => r.status === "pending");
  const allPicked = pendingVisible.length > 0 && pendingVisible.every((r) => picked.has(r.id));

  async function decide(id: string, status: Status) {
    const prev = rows;
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
    setPicked((cur) => {
      const n = new Set(cur);
      n.delete(id);
      return n;
    });
    const { error: updateError } = await supabase.from("members").update({ status }).eq("id", id);
    if (updateError) {
      setRows(prev);
      setError("처리 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  async function decidePicked(status: Status) {
    const ids = [...picked];
    if (ids.length === 0) return;
    const prev = rows;
    setRows((cur) => cur.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
    setPicked(new Set());
    const { error: updateError } = await supabase.from("members").update({ status }).in("id", ids);
    if (updateError) {
      setRows(prev);
      setError("처리 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  // ---------- 회원 목록 ----------
  const members = rows.filter((r) => r.status === "approved");
  const [q, setQ] = useState("");
  const [cohort, setCohort] = useState("all");
  const [role, setRole] = useState("all");
  /** 기본은 최근 가입순(불러온 순서), 필요하면 이름순으로 본다 */
  const [sort, setSort] = useState<"default" | "name">("default");

  const cohorts = useMemo(() => [...new Set(members.map((m) => m.cohort))], [members]);

  const filteredMembers = members.filter((m) => {
    const hitQ = !q.trim() || m.name.includes(q.trim()) || m.student_id.includes(q.trim());
    const hitC = cohort === "all" || m.cohort === cohort;
    const hitR = role === "all" || m.role === role;
    return hitQ && hitC && hitR;
  });

  // 한글 이름은 localeCompare 에 "ko" 를 줘야 자모 순서가 맞는다
  const visibleMembers =
    sort === "name"
      ? [...filteredMembers].sort((a, b) => a.name.localeCompare(b.name, "ko"))
      : filteredMembers;

  async function deleteMember(id: string, name: string) {
    if (!window.confirm(`${name} 회원을 삭제할까요? 로그인 계정도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    const prev = rows;
    setRows((cur) => cur.filter((r) => r.id !== id));
    const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setRows(prev);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "삭제 중 문제가 발생했습니다.");
    }
  }

  /**
   * 부원 ↔ 운영진은 운영진·관리자 누구나 바꿀 수 있다.
   * 관리자 지정·해제는 관리자만 — DB 트리거로도 한 번 더 막혀 있다
   * (isSelfAdmin 아니면 "관리자" 옵션 자체를 안 보여준다).
   */
  async function changeRole(id: string, nextRole: Role) {
    const prev = rows;
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, role: nextRole } : r)));
    const { error: updateError } = await supabase.from("members").update({ role: nextRole }).eq("id", id);
    if (updateError) {
      setRows(prev);
      setError("권한 변경 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  // ---------- 회원 정보 수정 ----------
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    gender: "",
    birth: "",
    cohort: "",
    track: "",
    mbti: "",
  });

  function startEdit(m: MemberRow) {
    setEditingId(m.id);
    setEditForm({
      name: m.name,
      gender: m.gender ?? "",
      birth: m.birth ?? "",
      cohort: m.cohort,
      track: m.track,
      mbti: m.mbti ?? "",
    });
  }

  async function saveEdit(id: string) {
    const patch = {
      name: editForm.name.trim(),
      gender: editForm.gender.trim() || null,
      birth: editForm.birth.trim() || null,
      cohort: editForm.cohort.trim(),
      track: editForm.track.trim(),
      mbti: editForm.mbti.trim() || null,
    };
    const prev = rows;
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setEditingId(null);
    const { error: updateError } = await supabase.from("members").update(patch).eq("id", id);
    if (updateError) {
      setRows(prev);
      setError("수정 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  async function resetPassword(id: string, name: string) {
    if (!window.confirm(`${name}의 비밀번호를 초기화할까요? 초기화하면 qwer1234로 로그인해야 합니다.`)) return;
    const res = await fetch(`/api/admin/members/${id}/reset-password`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "초기화 중 문제가 발생했습니다.");
      return;
    }
    window.alert(`비밀번호가 ${data.password}로 초기화됐습니다. 본인에게 안내해 주세요.`);
  }

  return (
    <>
      {error && <p className={tableStyles.muted}>{error}</p>}

      <Panel
        title="가입 승인 대기"
        count={`${pending.length}건`}
        desc="회원가입 신청을 확인하고 승인하면 학번과 비밀번호로 로그인할 수 있습니다."
      >
        <div className={toolbar.toolbar}>
          <input
            className={toolbar.search}
            placeholder="이름·학번 검색"
            aria-label="신청자 검색"
            value={reqQ}
            onChange={(e) => setReqQ(e.target.value)}
          />
          <span className={toolbar.spacer} />
          <button
            type="button"
            className={toolbar.button}
            onClick={() => decidePicked("rejected")}
            disabled={readOnly || picked.size === 0}
          >
            선택 반려{picked.size > 0 ? ` ${picked.size}` : ""}
          </button>
          <button
            type="button"
            className={cn(toolbar.button, toolbar.primary)}
            onClick={() => decidePicked("approved")}
            disabled={readOnly || picked.size === 0}
          >
            선택 일괄 승인{picked.size > 0 ? ` ${picked.size}` : ""}
          </button>
        </div>

        <DataTable
          columns={[
            <input
              key="all"
              type="checkbox"
              aria-label="대기 신청 전체 선택"
              checked={allPicked}
              disabled={readOnly}
              onChange={() =>
                setPicked(allPicked ? new Set() : new Set(pendingVisible.map((r) => r.id)))
              }
            />,
            "이름",
            "성별",
            "트랙 (학과)",
            "학번",
            "생년월일",
            "기수",
            "MBTI",
            "신청일",
            "상태",
            "",
          ]}
          isEmpty={!loading && rows.length === 0}
          empty={loading ? "불러오는 중..." : "가입 신청이 없습니다."}
        >
          {visibleReq.map((r) => (
            <tr key={r.id}>
              <td>
                {r.status === "pending" && (
                  <input
                    type="checkbox"
                    aria-label={`${r.name} 선택`}
                    checked={picked.has(r.id)}
                    disabled={readOnly}
                    onChange={() =>
                      setPicked((prev) => {
                        const n = new Set(prev);
                        if (n.has(r.id)) n.delete(r.id);
                        else n.add(r.id);
                        return n;
                      })
                    }
                  />
                )}
              </td>
              <td>{r.name}</td>
              <td className={tableStyles.muted}>{r.gender ?? "—"}</td>
              <td className={tableStyles.muted}>{r.track}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.student_id}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.birth ?? "—"}</td>
              <td className={tableStyles.muted}>{r.cohort}</td>
              <td className={tableStyles.muted}>{r.mbti ?? "—"}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{formatDate(r.created_at)}</td>
              <td>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </td>
              <td className={styles.rowActions}>
                {r.status === "pending" ? (
                  <>
                    <RowAction primary onClick={() => decide(r.id, "approved")} disabled={readOnly}>
                      승인
                    </RowAction>
                    <RowAction onClick={() => decide(r.id, "rejected")} disabled={readOnly}>
                      반려
                    </RowAction>
                  </>
                ) : (
                  <RowAction
                    onClick={() => decide(r.id, "pending")}
                    title="대기로 되돌리기"
                    disabled={readOnly}
                  >
                    되돌리기
                  </RowAction>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel
        title="회원 관리"
        count={`${members.length}명`}
        desc="승인된 부원 목록입니다. 로그인은 학번(ID)과 비밀번호로 합니다."
      >
        <div className={toolbar.toolbar}>
          <input
            className={toolbar.search}
            placeholder="이름·학번 검색"
            aria-label="회원 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className={toolbar.select}
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            aria-label="기수 필터"
          >
            <option value="all">기수: 전체</option>
            {cohorts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className={toolbar.select}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="권한 필터"
          >
            <option value="all">권한: 전체</option>
            <option value="부원">부원</option>
            <option value="운영진">운영진</option>
            <option value="관리자">관리자</option>
          </select>
          <select
            className={toolbar.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as "default" | "name")}
            aria-label="정렬"
          >
            <option value="default">최근 가입순</option>
            <option value="name">이름 가나다순</option>
          </select>
        </div>

        <DataTable
          columns={[
            "이름",
            "성별",
            "학번",
            "생년월일",
            "기수",
            "트랙 (학과)",
            "MBTI",
            "권한",
            "",
          ]}
          isEmpty={!loading && members.length === 0}
          empty={loading ? "불러오는 중..." : "조건에 맞는 회원이 없습니다."}
        >
          {visibleMembers.map((m) =>
            editingId === m.id ? (
              <tr key={m.id}>
                <td>
                  <input
                    className={toolbar.search}
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    aria-label="이름 수정"
                  />
                </td>
                <td>
                  <input
                    className={toolbar.search}
                    value={editForm.gender}
                    onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                    aria-label="성별 수정"
                  />
                </td>
                <td className={cn(tableStyles.muted, tableStyles.numeric)}>{m.student_id}</td>
                <td>
                  <input
                    className={toolbar.search}
                    value={editForm.birth}
                    onChange={(e) => setEditForm((f) => ({ ...f, birth: e.target.value }))}
                    aria-label="생년월일 수정"
                  />
                </td>
                <td>
                  <input
                    className={toolbar.search}
                    value={editForm.cohort}
                    onChange={(e) => setEditForm((f) => ({ ...f, cohort: e.target.value }))}
                    aria-label="기수 수정"
                  />
                </td>
                <td>
                  <input
                    className={toolbar.search}
                    value={editForm.track}
                    onChange={(e) => setEditForm((f) => ({ ...f, track: e.target.value }))}
                    aria-label="트랙 수정"
                  />
                </td>
                <td>
                  <input
                    className={toolbar.search}
                    value={editForm.mbti}
                    onChange={(e) => setEditForm((f) => ({ ...f, mbti: e.target.value }))}
                    aria-label="MBTI 수정"
                  />
                </td>
                <td>
                  <Badge tone={m.role === "관리자" ? "purple" : m.role === "운영진" ? "purple" : "grey"}>
                    {m.role}
                  </Badge>
                </td>
                <td className={styles.rowActions}>
                  <RowAction primary onClick={() => saveEdit(m.id)}>
                    저장
                  </RowAction>
                  <RowAction onClick={() => setEditingId(null)}>취소</RowAction>
                </td>
              </tr>
            ) : (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td className={tableStyles.muted}>{m.gender ?? "—"}</td>
                <td className={cn(tableStyles.muted, tableStyles.numeric)}>{m.student_id}</td>
                <td className={cn(tableStyles.muted, tableStyles.numeric)}>{m.birth ?? "—"}</td>
                <td className={tableStyles.muted}>{m.cohort}</td>
                <td className={tableStyles.muted}>{m.track}</td>
                <td className={tableStyles.muted}>{m.mbti ?? "—"}</td>
                <td>
                  {m.role === "관리자" && !isSelfAdmin ? (
                    <Badge tone="purple">관리자</Badge>
                  ) : (
                    <select
                      className={toolbar.select}
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value as Role)}
                      disabled={readOnly}
                      aria-label={`${m.name} 권한 변경`}
                      title={!isSelfAdmin ? "관리자 지정은 관리자만 할 수 있습니다." : undefined}
                    >
                      <option value="부원">부원</option>
                      <option value="운영진">운영진</option>
                      {isSelfAdmin && <option value="관리자">관리자</option>}
                    </select>
                  )}
                </td>
                <td className={styles.rowActions}>
                  <RowAction onClick={() => startEdit(m)} disabled={readOnly} title="회원 정보 수정">
                    수정
                  </RowAction>
                  <RowAction
                    onClick={() => resetPassword(m.id, m.name)}
                    disabled={readOnly}
                    title="비밀번호 초기화"
                  >
                    비밀번호 초기화
                  </RowAction>
                  {isSelfAdmin && (
                    <RowAction onClick={() => deleteMember(m.id, m.name)} disabled={readOnly} title="회원 삭제">
                      삭제
                    </RowAction>
                  )}
                </td>
              </tr>
            ),
          )}
        </DataTable>
      </Panel>
    </>
  );
}
