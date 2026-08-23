import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { adminMembers } from "@/lib/admin-data";
import { signupRequests } from "@/lib/signup";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "회원·기수·권한 · 해랑사리우" };

export default function AdminMembersPage() {
  const pending = signupRequests.filter((r) => r.state === "대기");

  return (
    <>
      <Panel
        title="가입 승인 대기"
        count={`${pending.length}건`}
        desc="회원가입 신청을 확인하고 승인하면 학번과 생년월일로 로그인할 수 있습니다."
      >
        <div className={toolbar.toolbar}>
          <input className={toolbar.search} placeholder="이름·학번 검색" aria-label="신청자 검색" />
          <span className={toolbar.spacer} />
          <button type="button" className={toolbar.button}>
            선택 반려
          </button>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            선택 일괄 승인
          </button>
        </div>

        <DataTable
          columns={["이름", "성별", "트랙 (학과)", "학번", "생년월일", "MBTI", "신청일", "상태", ""]}
          isEmpty={signupRequests.length === 0}
          empty="가입 신청이 없습니다."
        >
          {signupRequests.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td className={tableStyles.muted}>{r.gender}</td>
              <td className={tableStyles.muted}>{r.track}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.studentId}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.birth}</td>
              <td className={tableStyles.muted}>{r.mbti ?? "—"}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{r.requestedAt}</td>
              <td>
                <Badge
                  tone={r.state === "승인" ? "green" : r.state === "반려" ? "grey" : "orange"}
                >
                  {r.state}
                </Badge>
              </td>
              <td>
                <RowAction primary={r.state === "대기"}>
                  {r.state === "대기" ? "승인" : "보기"}
                </RowAction>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel
        title="회원 관리"
        count={`${adminMembers.length}명`}
        desc="승인된 부원 목록입니다. 로그인은 학번(ID)과 생년월일 6자리(PW)로 합니다."
      >
        <div className={toolbar.toolbar}>
          <input className={toolbar.search} placeholder="이름·학번 검색" aria-label="회원 검색" />
          <select className={toolbar.select} defaultValue="all" aria-label="기수 필터">
            <option value="all">기수: 전체</option>
            <option value="59">59기</option>
            <option value="58">58기</option>
          </select>
          <select className={toolbar.select} defaultValue="all" aria-label="권한 필터">
            <option value="all">권한: 전체</option>
            <option value="member">부원</option>
            <option value="admin">운영진</option>
          </select>
          <span className={toolbar.spacer} />
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            ＋ 회원 직접 등록
          </button>
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
          {adminMembers.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td className={tableStyles.muted}>{m.gender}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>{m.studentId}</td>
              <td className={cn(tableStyles.muted, tableStyles.numeric)}>••••••</td>
              <td className={tableStyles.muted}>{m.cohort}</td>
              <td className={tableStyles.muted}>{m.track}</td>
              <td className={tableStyles.muted}>{m.mbti ?? "—"}</td>
              <td>
                <Badge tone={m.role === "운영진" ? "purple" : "grey"}>{m.role}</Badge>
              </td>
              <td className={tableStyles.numeric}>{m.hours}시간</td>
              <td>
                <RowAction>수정</RowAction>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
