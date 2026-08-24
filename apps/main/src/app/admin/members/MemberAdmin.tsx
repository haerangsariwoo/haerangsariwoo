"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { adminMembers as memberSeed } from "@/lib/admin-data";
import { cohortLabel, signupRequests as signupSeed } from "@/lib/signup";
import { useSemester } from "../SemesterContext";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "../volunteers/volunteers.module.css";

export function MemberAdmin() {
  const { readOnly } = useSemester();
  // ---------- 가입 승인 대기 ----------
  const [requests, setRequests] = useState(signupSeed);
  const [reqQ, setReqQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const visibleReq = requests.filter(
    (r) => !reqQ.trim() || r.name.includes(reqQ.trim()) || r.studentId.includes(reqQ.trim()),
  );
  const pending = requests.filter((r) => r.state === "대기");

  function decide(id: string, state: "승인" | "반려" | "대기") {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, state } : r)));
    setPicked((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }

  function decidePicked(state: "승인" | "반려") {
    setRequests((prev) => prev.map((r) => (picked.has(r.id) ? { ...r, state } : r)));
    setPicked(new Set());
  }

  const pendingVisible = visibleReq.filter((r) => r.state === "대기");
  const allPicked = pendingVisible.length > 0 && pendingVisible.every((r) => picked.has(r.id));

  // ---------- 회원 목록 ----------
  const [members, setMembers] = useState(memberSeed);
  const [q, setQ] = useState("");
  const [cohort, setCohort] = useState("all");
  const [role, setRole] = useState("all");

  const cohorts = useMemo(() => [...new Set(memberSeed.map((m) => m.cohort))], []);

  const visibleMembers = members.filter((m) => {
    const hitQ = !q.trim() || m.name.includes(q.trim()) || m.studentId.includes(q.trim());
    const hitC = cohort === "all" || m.cohort === cohort;
    const hitR = role === "all" || m.role === role;
    return hitQ && hitC && hitR;
  });

  /** 부원 ↔ 운영진 */
  function toggleRole(id: string) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: m.role === "운영진" ? "부원" : "운영진" } : m)),
    );
  }

  return (
    <>
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
            onClick={() => decidePicked("반려")}
            disabled={readOnly || picked.size === 0}
          >
            선택 반려{picked.size > 0 ? ` ${picked.size}` : ""}
          </button>
          <button
            type="button"
            className={cn(toolbar.button, toolbar.primary)}
            onClick={() => decidePicked("승인")}
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
          isEmpty={requests.length === 0}
          empty="가입 신청이 없습니다."
        >
          {visibleReq.map((r) => (
            <tr key={r.id}>
              <td>
                {r.state === "대기" && (
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
              <td className={tableStyles.muted}>{r.gender}</td>
              <td className={tableStyles.muted}>{r.track}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.studentId}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.birth}</td>
              <td className={tableStyles.muted}>{cohortLabel(r.joinYear, r.joinSemester)}</td>
              <td className={tableStyles.muted}>{r.mbti ?? "—"}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.requestedAt}</td>
              <td>
                <Badge tone={r.state === "승인" ? "green" : r.state === "반려" ? "grey" : "orange"}>
                  {r.state}
                </Badge>
              </td>
              <td className={styles.rowActions}>
                {r.state === "대기" ? (
                  <>
                    <RowAction primary onClick={() => decide(r.id, "승인")} disabled={readOnly}>
                      승인
                    </RowAction>
                    <RowAction onClick={() => decide(r.id, "반려")} disabled={readOnly}>
                      반려
                    </RowAction>
                  </>
                ) : (
                  <RowAction
                    onClick={() => decide(r.id, "대기")}
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
        desc="승인된 부원 목록입니다. 로그인은 학번(ID)과 개인 비밀번호 4자리로 합니다."
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
            "누적시간",
            "",
          ]}
        >
          {visibleMembers.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td className={tableStyles.muted}>{m.gender}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{m.studentId}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{m.birth}</td>
              <td className={tableStyles.muted}>{m.cohort}</td>
              <td className={tableStyles.muted}>{m.track}</td>
              <td className={tableStyles.muted}>{m.mbti ?? "—"}</td>
              <td>
                <Badge tone={m.role === "운영진" ? "purple" : "grey"}>{m.role}</Badge>
              </td>
              <td className={tableStyles.numeric}>{m.hours}시간</td>
              <td>
                <RowAction
                  onClick={() => toggleRole(m.id)}
                  title={m.role === "운영진" ? "부원으로 내리기" : "운영진으로 올리기"}
                  disabled={readOnly}
                >
                  {m.role === "운영진" ? "부원으로" : "운영진으로"}
                </RowAction>
              </td>
            </tr>
          ))}
          {visibleMembers.length === 0 && (
            <tr>
              <td colSpan={10} className={tableStyles.muted}>
                조건에 맞는 회원이 없습니다.
              </td>
            </tr>
          )}
        </DataTable>
      </Panel>
    </>
  );
}
